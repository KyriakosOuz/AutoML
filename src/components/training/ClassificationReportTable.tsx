
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// The report prop should be an object mapping label => {precision, recall, support, ...}
export interface ClassificationReportTableProps {
  report: Record<string, any> | string | null;
}

const ClassificationReportTable: React.FC<ClassificationReportTableProps> = ({
  report,
}) => {
  if (!report) {
    return (
      <p className="text-xs text-muted-foreground">
        No classification report found
      </p>
    );
  }

  if (typeof report === "string") {
    return (
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
        {report}
      </pre>
    );
  }

  // Only show per-class rows, not "accuracy", "macro avg" or "weighted avg"
  const shownClasses = Object.entries(report).filter(
    ([label]) =>
      label !== "accuracy" && label !== "macro avg" && label !== "weighted avg"
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead>Precision</TableHead>
          <TableHead>Recall</TableHead>
          <TableHead>F1-score</TableHead>
          <TableHead>Support</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shownClasses.map(([cls, stats]) => (
          <TableRow key={cls}>
            <TableCell>{cls}</TableCell>
            <TableCell>
              {"precision" in stats ? stats.precision.toFixed(2) : "-"}
            </TableCell>
            <TableCell>
              {"recall" in stats ? stats.recall.toFixed(2) : "-"}
            </TableCell>
            <TableCell>
              {"f1-score" in stats ? stats["f1-score"].toFixed(2) : "-"}
            </TableCell>
            <TableCell>
              {"support" in stats ? stats.support : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ClassificationReportTable;
