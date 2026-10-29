import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, COMPANY_STATUS_LABELS, type CompanyStatus } from "@/lib/jobs";
import { EMPLOYMENT_STATUS_LABELS, type EmploymentStatus } from "@/lib/graduates";
import { SURVEY_STATUS_LABELS, type SurveyStatus } from "@/lib/surveys";

function Punto() {
  return <span aria-hidden className="size-1.5 rounded-full bg-current" />;
}

export function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const variante = status === "EMPLOYED" ? "soft" : status === "INDEPENDENT" ? "secondary" : "outline";
  return (
    <Badge variant={variante}>
      <Punto />
      {EMPLOYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const variante = status === "PUBLISHED" ? "soft" : status === "CLOSED" ? "secondary" : "outline";
  return (
    <Badge variant={variante}>
      <Punto />
      {SURVEY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  const variante =
    status === "ACCEPTED" ? "soft" : status === "REJECTED" ? "destructive" : status === "IN_REVIEW" ? "secondary" : "outline";
  return (
    <Badge variant={variante}>
      <Punto />
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const variante = status === "APPROVED" ? "soft" : status === "REJECTED" ? "destructive" : "outline";
  return (
    <Badge variant={variante}>
      <Punto />
      {COMPANY_STATUS_LABELS[status]}
    </Badge>
  );
}
