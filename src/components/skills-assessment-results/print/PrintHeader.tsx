/**
 * PrintHeader Component
 * Print-only header for Skills Assessment Report
 * Hidden on screen, visible only when printing
 */

interface PrintHeaderProps {
  userName: string;
  assessmentDate: string;
  careerGoal?: string;
}

export function PrintHeader({ userName, assessmentDate, careerGoal }: PrintHeaderProps) {
  return (
    <div className="hidden print:block mb-8 border-b pb-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Skills Assessment Report</h1>
        <p className="text-lg mt-2">{userName}</p>
        {careerGoal && <p className="text-sm mt-1">Career Goal: {careerGoal}</p>}
        <p className="text-sm text-muted-foreground mt-2">
          Generated on {new Date(assessmentDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
