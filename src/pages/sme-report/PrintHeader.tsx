import type { PrintHeaderProps } from './types';

export function PrintHeader({ companyName, completedAt }: PrintHeaderProps) {
  return (
    <div className="hidden print:block mb-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold">AI Opportunity Assessment Report</h1>
        <p className="text-lg">{companyName}</p>
        <p className="text-sm text-muted-foreground">
          Completed on {new Date(completedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
