function TaskItem({ task, onToggle, onDelete }) {
  return (
    <div style={{ marginBottom: "15px",
             padding: "15px",
             borderRadius: "8px",
             background: "#f9fafb",
             marginBottom: "15px"}}>
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <p>  Status:{" "} <span style={{
       color: task.status === "completed" ? "green" : "orange",
       fontWeight: "bold"}}>
      {task.status}
      </span></p>

      <button onClick={() => onToggle(task)}>
        Toggle Status
      </button>
      <span style={{ margin: "0 10px" }}></span>
      <button onClick={() => onDelete(task._id)}>
        Delete
      </button>

      <hr />
    </div>
  );
}

export default TaskItem;