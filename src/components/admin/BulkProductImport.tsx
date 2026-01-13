import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ImportRow {
  name: string;
  description: string;
  price: number;
  category: string;
  in_stock: boolean;
  is_featured: boolean;
  image_url: string;
  error?: string;
  status?: 'pending' | 'success' | 'error';
}

interface BulkProductImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const BulkProductImport = ({ open, onOpenChange, onImportComplete }: BulkProductImportProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>({});

  const parseCSV = (content: string): ImportRow[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const parsedRows: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: ImportRow = {
        name: values[headers.indexOf('name')] || '',
        description: values[headers.indexOf('description')] || '',
        price: parseFloat(values[headers.indexOf('price')] || '0'),
        category: values[headers.indexOf('category')] || '',
        in_stock: values[headers.indexOf('in_stock')]?.toLowerCase() !== 'false',
        is_featured: values[headers.indexOf('is_featured')]?.toLowerCase() === 'true',
        image_url: values[headers.indexOf('image_url')] || '',
        status: 'pending',
      };

      // Validate
      if (!row.name) {
        row.error = 'Name is required';
      } else if (isNaN(row.price) || row.price <= 0) {
        row.error = 'Valid price is required';
      }

      parsedRows.push(row);
    }

    return parsedRows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fetch categories first
    const { data: cats } = await supabase.from('categories').select('id, name');
    const catMap: Record<string, string> = {};
    cats?.forEach(c => {
      catMap[c.name.toLowerCase()] = c.id;
    });
    setCategories(catMap);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter(r => !r.error);
    if (validRows.length === 0) {
      toast({ title: 'No valid rows to import', variant: 'destructive' });
      return;
    }

    setImporting(true);

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.error) continue;

        try {
          // Find or create category
          let categoryId = categories[row.category.toLowerCase()];
          if (!categoryId && row.category) {
            const { data: newCat } = await supabase
              .from('categories')
              .insert({ name: row.category })
              .select()
              .single();
            if (newCat) {
              categoryId = newCat.id;
              setCategories(prev => ({ ...prev, [row.category.toLowerCase()]: newCat.id }));
            }
          }

          await supabase
            .from('products')
            .insert({
              name: row.name,
              description: row.description || null,
              price: row.price,
              category_id: categoryId || null,
              in_stock: row.in_stock,
              is_featured: row.is_featured,
              image_url: row.image_url || null,
            });

          setRows(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'success' } : r
          ));
        } catch (error) {
          setRows(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: 'error', error: 'Failed to import' } : r
          ));
        }
      }

      toast({ title: 'Import completed!', description: `${validRows.length} products imported` });
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    onOpenChange(false);
  };

  const validCount = rows.filter(r => !r.error).length;
  const errorCount = rows.filter(r => r.error).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Bulk Product Import
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                CSV should have columns: name, description, price, category, in_stock, is_featured, image_url
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select CSV File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex gap-4">
                <Card className="flex-1">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valid</p>
                      <p className="text-xl font-bold text-success">{validCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="flex-1">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <div>
                      <p className="text-sm text-muted-foreground">Errors</p>
                      <p className="text-xl font-bold text-destructive">{errorCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Table */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[300px]">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Status</th>
                          <th className="text-left p-3 text-sm font-medium">Name</th>
                          <th className="text-left p-3 text-sm font-medium">Price</th>
                          <th className="text-left p-3 text-sm font-medium">Category</th>
                          <th className="text-left p-3 text-sm font-medium">In Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr key={idx} className={cn("border-b", row.error && "bg-destructive/5")}>
                            <td className="p-3">
                              {row.status === 'success' ? (
                                <Check className="w-4 h-4 text-success" />
                              ) : row.status === 'error' || row.error ? (
                                <X className="w-4 h-4 text-destructive" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-muted" />
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{row.name || '—'}</span>
                              {row.error && (
                                <p className="text-xs text-destructive">{row.error}</p>
                              )}
                            </td>
                            <td className="p-3">₹{row.price}</td>
                            <td className="p-3">{row.category || '—'}</td>
                            <td className="p-3">
                              <Badge variant={row.in_stock ? 'default' : 'secondary'}>
                                {row.in_stock ? 'Yes' : 'No'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setRows([])}>
                  Reset
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importing || validCount === 0}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${validCount} Products`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkProductImport;
