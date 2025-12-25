/**
 * PrintHeader Component
 *
 * Print-only header for Skills Assessment Report
 * Shows user info and assessment metadata
 * Visible only when printing (hidden print:block)
 */

interface PrintHeaderProps {
  userName: string;
  assessmentDate: string;
  careerGoal?: string;
}

export function PrintHeader({ userName, assessmentDate, careerGoal }: PrintHeaderProps) {
  const formattedDate = new Date(assessmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
      <h1 className="text-3xl font-bold text-black mb-2">Skills Assessment Report</h1>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-black">{userName}</p>
        {careerGoal && (
          <p className="text-sm text-black">
            <span className="font-medium">Career Goal:</span> {careerGoal}
          </p>
        )}
        <p className="text-sm text-gray-700">
          <span className="font-medium">Generated:</span> {formattedDate}
        </p>
      </div>
    </div>
  );
}
