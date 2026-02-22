import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import TaskList from "../components/TaskList";
// import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/");
};
const fetchTasks = async () => {
  try {
    setLoading(true);
    const { data } = await API.get("/tasks");
    setTasks(data);
  } catch (error) {
    alert("Error fetching tasks");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.post("/tasks", { title, description });

      setTasks((prev) => [data, ...prev]); // add new task to list
      setTitle("");
      setDescription("");

      // fetchTasks(); // refresh task list
    } catch (error) {
      alert("Error creating task");
    }
  };
  const handleToggle = async (task) => {
    try {
      const { data } = await API.put(`/tasks/${task._id}`, {
        status: task.status === "pending" ? "completed" : "pending",
      });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? data : t))
      );
    } catch (error) {
      alert("Error updating task");
    } 
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      alert("Error deleting task");
    }
  };


  return (
    <div style={{ padding: "40px", background: "#f4f6f9", minHeight: "100vh" }}>
      <button onClick={handleLogout}>Logout</button>

      <h2>Dashboard</h2>

      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br /><br />
        <input
          type="text"
          placeholder="Task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br /><br />
        <button type="submit">Add Task</button>
      </form>

      <hr />
      <div style={{ marginTop: "20px", background: "white",padding: "20px",borderRadius: "10px",boxShadow: "0 4px 10px rgba(0,0,0,0.05)",   
       }}>
      {loading && <p>Loading tasks...</p>}
            <div style={{
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
}}>
      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      </div>
    </div>
  </div>
  );
}
export default Dashboard;
