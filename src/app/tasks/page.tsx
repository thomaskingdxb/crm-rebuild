import { getTasks, getTaskTypes } from '@/lib/tasks';
import { getClientsBasic } from '@/lib/clients';
import { getListingUpdatesDue } from '@/lib/properties';
import { createClient } from '@/lib/supabase/server';
import TasksList from '@/components/TasksList';
import AddTaskButton from '@/components/AddTaskButton';

export default async function TasksPage() {
  const supabase = await createClient();
  // Ensures any due weekly listing updates have a real linked task before we
  // read tasks below (see getListingUpdatesDue's ensure-task-exists behavior).
  await getListingUpdatesDue(supabase);
  const [tasks, taskTypes, clients] = await Promise.all([getTasks(supabase), getTaskTypes(supabase), getClientsBasic(supabase)]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Tasks</h1>
            <p className="text-sm text-zinc-500">{tasks.length} total</p>
          </div>
          <AddTaskButton
            clients={clients}
            taskTypes={taskTypes}
            label="+ Add Task"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          />
        </div>

        <TasksList tasks={tasks} taskTypes={taskTypes} clients={clients} />
      </div>
    </div>
  );
}
