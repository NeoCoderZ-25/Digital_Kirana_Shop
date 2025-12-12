import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          product_id,
          products (name, category_id, categories (name))
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch popular products
    const { data: popularProducts } = await supabase
      .from('products')
      .select('id, name, category_id, categories (name)')
      .eq('in_stock', true)
      .order('order_count', { ascending: false })
      .limit(20);

    // Fetch all products for recommendations
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, price, category_id, categories (name)')
      .eq('in_stock', true);

    // Build context for AI
    const purchasedProducts = orders?.flatMap(o => 
      o.order_items?.map((item: any) => ({
        name: item.products?.name,
        category: item.products?.categories?.name
      }))
    ).filter(Boolean) || [];

    const categoriesPurchased = [...new Set(purchasedProducts.map(p => p?.category).filter(Boolean))];

    const prompt = `You are a shopping recommendation AI for a grocery/e-commerce app called ShopEase.

User's purchase history categories: ${categoriesPurchased.join(', ') || 'No previous purchases'}
Recent products purchased: ${purchasedProducts.slice(0, 10).map(p => p?.name).join(', ') || 'None'}

Available products:
${allProducts?.slice(0, 30).map(p => `- ${p.name} (${(p.categories as any)?.name || 'General'})`).join('\n')}

Based on the user's purchase history and preferences, recommend exactly 6 product IDs that the user would likely want to buy. Consider:
1. Products from categories they've bought before
2. Complementary products to their purchases
3. Popular products they might like
4. If no history, recommend popular/essential items

Return ONLY a JSON array of product IDs, nothing else. Example: ["id1", "id2", "id3", "id4", "id5", "id6"]

Available product IDs: ${allProducts?.map(p => p.id).join(', ')}`;

    console.log('Sending request to Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful shopping recommendation assistant. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fallback to popular products
      const fallbackIds = popularProducts?.slice(0, 6).map(p => p.id) || [];
      return new Response(JSON.stringify({ productIds: fallbackIds, source: 'fallback' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response content:', content);

    // Parse the AI response - extract JSON array
    let recommendedIds: string[] = [];
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        recommendedIds = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      recommendedIds = popularProducts?.slice(0, 6).map(p => p.id) || [];
    }

    // Validate IDs exist in our products
    const validProductIds = allProducts?.map(p => p.id) || [];
    recommendedIds = recommendedIds.filter(id => validProductIds.includes(id)).slice(0, 6);

    // If not enough recommendations, fill with popular products
    if (recommendedIds.length < 6) {
      const additionalIds = popularProducts
        ?.filter(p => !recommendedIds.includes(p.id))
        .slice(0, 6 - recommendedIds.length)
        .map(p => p.id) || [];
      recommendedIds = [...recommendedIds, ...additionalIds];
    }

    console.log('Final recommendations:', recommendedIds);

    return new Response(JSON.stringify({ productIds: recommendedIds, source: 'ai' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-recommendations:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
