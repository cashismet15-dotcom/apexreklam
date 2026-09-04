import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddTaskForm } from "@/components/daily-tasks/add-task-form"
import { PersonRowActions } from "@/components/daily-tasks/person-row-actions"
import { TaskRow } from "@/components/daily-tasks/task-row"
import { formatDayLabel } from "@/lib/daily-tracker"
import type { DailyTaskBoardPerson } from "@/lib/daily-tasks-data"
import { cn } from "@/lib/utils"

export function PersonCard({
  boardPerson,
  dates,
  todayDate,
}: {
  boardPerson: DailyTaskBoardPerson
  dates: string[]
  todayDate: string
}) {
  const { person, rows, overdueCount } = boardPerson

  return (
    <Card size="sm" className="gap-0 py-0">
      <CardHeader className="py-3">
        <CardTitle>{person.name}</CardTitle>
        <CardAction className="flex items-center gap-1.5">
          {overdueCount > 0 ? (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
              {overdueCount} gecikmiş
            </Badge>
          ) : null}
          <PersonRowActions person={person} />
        </CardAction>
      </CardHeader>

      <Separator />

      {rows.length === 0 ? (
        <div className="flex h-14 items-center justify-center text-sm text-muted-foreground">
          Henüz görev eklenmedi.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Görev</TableHead>
              {dates.map((date) => (
                <TableHead key={date} className="text-center">
                  <span className={cn("capitalize", date === todayDate && "text-primary")}>
                    {formatDayLabel(date)}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ task, cells }) => (
              <TaskRow key={task.id} taskId={task.id} title={task.title} cells={cells} />
            ))}
          </TableBody>
        </Table>
      )}

      <Separator />

      <CardContent className="p-0">
        <AddTaskForm personId={person.id} />
      </CardContent>
    </Card>
  )
}
