
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { downloadFile } from '@/components/training/prediction/utils/downloadUtils';

export interface H2OLeaderboardTableProps {
  leaderboardData: any[];
  leaderboardCsvUrl?: string;
}

const H2OLeaderboardTable: React.FC<H2OLeaderboardTableProps> = ({ 
  leaderboardData,
  leaderboardCsvUrl
}) => {
  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No leaderboard data available for this model.</p>
        </CardContent>
      </Card>
    );
  }

  // Get column headers from the first item's keys
  const columnsToShow = Object.keys(leaderboardData[0]).filter(key => 
    !key.includes('_') && 
    key !== 'id' && 
    key !== 'model_id' &&
    key !== 'description'
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Model Leaderboard</CardTitle>
        {leaderboardCsvUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => downloadFile(leaderboardCsvUrl, 'h2o_leaderboard.csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Model</TableHead>
                {columnsToShow.map(column => (
                  <TableHead key={column} className="whitespace-nowrap">
                    {column.charAt(0).toUpperCase() + column.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((model, index) => (
                <TableRow key={model.model_id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {model.model_id || `Model ${index + 1}`}
                  </TableCell>
                  {columnsToShow.map(column => (
                    <TableCell key={column}>
                      {typeof model[column] === 'number' 
                        ? model[column].toFixed(4)
                        : model[column]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default H2OLeaderboardTable;
