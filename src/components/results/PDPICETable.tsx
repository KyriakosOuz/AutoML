
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileImage, ExternalLink } from 'lucide-react';

export interface PDPPlot {
  plot_type: 'pdp' | 'ice';
  feature: string;
  class_id?: string | number;
  class_name?: string;
  file_url: string;
  related_feature_importance?: string;
}

interface PDPICETableProps {
  plots: PDPPlot[];
}

const PDPICETable: React.FC<PDPICETableProps> = ({ plots }) => {
  if (!plots || plots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partial Dependence & ICE Plots</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No PDP/ICE plots available for this model.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Partial Dependence & ICE Plots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Related</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plots.map((plot, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {plot.plot_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{plot.feature}</TableCell>
                  <TableCell>{plot.class_name || plot.class_id || 'All'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileImage className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            {plot.plot_type.toUpperCase()} Plot: {plot.feature}
                            {plot.class_name && ` - Class ${plot.class_name}`}
                          </h3>
                          <div className="mt-2 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={plot.file_url} 
                              alt={`${plot.plot_type} plot for ${plot.feature}`}
                              className="w-full h-auto" 
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    {plot.related_feature_importance ? (
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={plot.related_feature_importance} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Importance
                        </a>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDPICETable;
