import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CoachesTable } from "./coaches-table";

export default function AdminCoachesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Koçlar</CardTitle>
        <CardDescription>Aktif koçlar ve öğrenci yükleri.</CardDescription>
      </CardHeader>
      <CardContent>
        <CoachesTable />
      </CardContent>
    </Card>
  );
}
