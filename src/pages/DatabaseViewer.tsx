import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, Upload, Database, RefreshCw } from 'lucide-react';
import { getAllTables, getTableData, getTableCount, exportDatabase } from '@/db/db';
import { useDB } from '@/contexts/DBProvider';
import { toast } from 'sonner';
import { executePersistenceTest, simulateNavigation } from '@/test-persistence';

// Only show in development
if (import.meta.env.PROD) {
  throw new Error('Database Viewer is only available in development mode');
}

const DatabaseViewer: React.FC = () => {
  const { db, isLoading: isDBLoading } = useDB(); // Use the global database context
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableCount, setTableCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);

  const isDatabaseReady = !!db && !isDBLoading;

  useEffect(() => {
    if (isDatabaseReady) {
      loadTables();
    }
  }, [isDatabaseReady]);

  useEffect(() => {
    if (selectedTable && isDatabaseReady) {
      loadTableData();
    }
  }, [selectedTable, currentPage, isDatabaseReady]);

  const loadTables = async () => {
    try {
      const tableNames = getAllTables();
      setTables(tableNames);
      if (tableNames.length > 0 && !selectedTable) {
        setSelectedTable(tableNames[0]);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Failed to load database tables');
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const data = getTableData(selectedTable, pageSize, offset);
      const count = getTableCount(selectedTable);
      
      setTableData(data);
      setTableCount(count);
    } catch (error) {
      console.error('Error loading table data:', error);
      toast.error('Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportDatabase = () => {
    try {
      const blob = exportDatabase();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_database_${new Date().toISOString().split('T')[0]}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Database exported successfully');
    } catch (error) {
      console.error('Error exporting database:', error);
      toast.error('Failed to export database');
    }
  };

  const handleImportDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.sqlite') && !file.name.endsWith('.db')) {
      toast.error('Please select a valid SQLite database file');
      return;
    }

    // Import functionality removed - should be handled by DBProvider context
    toast.error('Database import functionality is deprecated');

    // Reset input
    event.target.value = '';
  };

  const totalPages = Math.ceil(tableCount / pageSize);

  const renderTableData = () => {
    if (!tableData.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data found in this table
        </div>
      );
    }

    const columns = Object.keys(tableData[0]);

    return (
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column} className="max-w-xs truncate">
                    {row[column] === null ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : typeof row[column] === 'boolean' ? (
                      <Badge variant={row[column] ? 'default' : 'secondary'}>
                        {row[column].toString()}
                      </Badge>
                    ) : (
                      String(row[column])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Database Viewer</h1>
          <Badge variant="outline">Development Only</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={loadTables} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={() => {
              const result = executePersistenceTest();
              const navResult = simulateNavigation();
              console.log('Teste completo:', { persistence: result, navigation: navResult });
              toast(result.success ? 'Teste passou!' : 'Teste falhou!', {
                description: result.message
              });
            }}
            variant="outline" 
            size="sm"
          >
            🧪 Executar Teste
          </Button>
          
          <Button onClick={handleExportDatabase} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export DB
          </Button>
          
          <label htmlFor="import-db">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import DB
              </span>
            </Button>
          </label>
          <input
            id="import-db"
            type="file"
            accept=".sqlite,.db"
            onChange={handleImportDatabase}
            className="hidden"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Explorer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTable && (
              <Badge variant="secondary">
                {tableCount} rows
              </Badge>
            )}
          </div>

          {selectedTable && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading table data...
                </div>
              ) : (
                renderTableData()
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, tableCount)} of {tableCount} rows
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseViewer;