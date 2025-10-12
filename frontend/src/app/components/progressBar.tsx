import LinearProgress from "@mui/material/LinearProgress";

interface ProgressBarProps {
  status: string;
  currentPage: number;
  totalPages: number;
  step?: number;
}

export default function ProgressBar({
  status,
  currentPage,
  totalPages,
  step = 0,
}: ProgressBarProps) {
  return (
    <div className={`w-70 ${status === 'idle' && 'invisible'}`} >
      <span>{status}</span>
      <LinearProgress color={status === 'Scan complete!' ? 'success' : 'primary'} variant="determinate" value={(step + currentPage) / (totalPages + 2) * 100} />
    </div>
  );
}
