import TaskItem from "./TaskItem";

function TaskList({ tasks, loading, onToggle, onDelete }) {
  if (loading) return <p>Loading tasks...</p>;

  if (tasks.length === 0)
    return <p>You don’t have any tasks yet. Add one above.</p>;

  return (
    <>
      {tasks.map((task) => (
        <TaskItem
          key={task._id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export default TaskList;