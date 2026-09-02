import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StudentsTable } from "./students-table";

export default function AdminStudentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Öğrenciler</CardTitle>
        <CardDescription>Öğrencileri koçlara ata, hedef alanlarını yönet.</CardDescription>
      </CardHeader>
      <CardContent>
        <StudentsTable />
      </CardContent>
    </Card>
  );
}
