import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { clearToken } from "../utils/auth";
import { getErrorMessage } from "../utils/http";

const ALL_CATEGORY_ID = "all";
const CREATE_NEW_CATEGORY_ID = "__create_new__";
const COMPLETION_TOAST_DURATION_MS = 1800;
const CATEGORY_NAME_LIMIT = 50;

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const toTimestamp = (value) => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getTaskCategoryId = (task) => {
  if (!task || !task.category) {
    return "";
  }

  if (typeof task.category === "string") {
    return task.category;
  }

  if (typeof task.category === "object" && task.category._id) {
    return String(task.category._id);
  }

  return "";
};

const getTaskCategoryName = (task) => {
  if (!task || !task.category) {
    return "Uncategorized";
  }

  if (typeof task.category === "object" && task.category.name) {
    return task.category.name;
  }

  return "Category";
};

const sortCategoriesByName = (categories) => {
  return [...categories].sort((firstCategory, secondCategory) =>
    firstCategory.name.localeCompare(secondCategory.name)
  );
};

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORY_ID);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [menuTaskId, setMenuTaskId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [completionToast, setCompletionToast] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateTaskSubmitting, setIsCreateTaskSubmitting] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createCategorySelection, setCreateCategorySelection] = useState(ALL_CATEGORY_ID);
  const [createCategoryName, setCreateCategoryName] = useState("");

  const navigate = useNavigate();

  const closeMenu = () => setMenuTaskId("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([API.get("/tasks"), API.get("/categories")])
      .then(([tasksResponse, categoriesResponse]) => {
        if (!isMounted) {
          return;
        }

        setTasks(tasksResponse.data);
        setCategories(sortCategoriesByName(categoriesResponse.data));
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error, "Could not load dashboard data right now."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryFilters = useMemo(
    () => [{ _id: ALL_CATEGORY_ID, name: "All Tasks" }, ...categories],
    [categories]
  );

  const filteredTasks = useMemo(() => {
    if (activeCategoryId === ALL_CATEGORY_ID) {
      return tasks;
    }

    return tasks.filter((task) => getTaskCategoryId(task) === activeCategoryId);
  }, [activeCategoryId, tasks]);

  const orderedTasks = useMemo(() => {
    return [...filteredTasks].sort((firstTask, secondTask) => {
      if (firstTask.status !== secondTask.status) {
        return firstTask.status === "completed" ? 1 : -1;
      }

      return toTimestamp(secondTask.updatedAt) - toTimestamp(firstTask.updatedAt);
    });
  }, [filteredTasks]);

  const activeCategoryName = useMemo(() => {
    const activeCategory = categoryFilters.find((category) => category._id === activeCategoryId);
    return activeCategory ? activeCategory.name : "All Tasks";
  }, [activeCategoryId, categoryFilters]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks]
  );

  const pendingCount = tasks.length - completedCount;

  useEffect(() => {
    if (!completionToast) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCompletionToast("");
    }, COMPLETION_TOAST_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [completionToast]);

  useEffect(() => {
    if (!menuTaskId) {
      return undefined;
    }

    const handleDocumentPointerDown = (event) => {
      const target = event.target;

      if (!(target instanceof Element) || !target.closest(".task-menu-container")) {
        setMenuTaskId("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuTaskId("");
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuTaskId]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsCreateModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCreateModalOpen]);

  const handleLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  const openCreateModal = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateCategorySelection(ALL_CATEGORY_ID);
    setCreateCategoryName("");
    closeMenu();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!isCreateTaskSubmitting) {
      setIsCreateModalOpen(false);
    }
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    closeMenu();
    setErrorMessage("");
    setInfoMessage("");
  };

  const cancelEditing = () => {
    setEditingTaskId("");
    setEditTitle("");
    setEditDescription("");
  };

  const resolveCategoryForTaskCreation = async () => {
    if (createCategorySelection === ALL_CATEGORY_ID) {
      return null;
    }

    if (createCategorySelection === CREATE_NEW_CATEGORY_ID) {
      const trimmedCategoryName = createCategoryName.trim();

      if (!trimmedCategoryName) {
        throw new Error("New category name is required.");
      }

      if (trimmedCategoryName.length > CATEGORY_NAME_LIMIT) {
        throw new Error(`Category name must be ${CATEGORY_NAME_LIMIT} characters or less.`);
      }

      const { data: createdCategory } = await API.post("/categories", {
        name: trimmedCategoryName,
      });

      setCategories((currentCategories) =>
        sortCategoriesByName([...currentCategories, createdCategory])
      );

      return createdCategory._id;
    }

    return createCategorySelection;
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const trimmedTitle = createTitle.trim();
    const trimmedDescription = createDescription.trim();

    if (!trimmedTitle) {
      setErrorMessage("Task title is required.");
      return;
    }

    try {
      setIsCreateTaskSubmitting(true);

      const categoryId = await resolveCategoryForTaskCreation();

      const payload = {
        title: trimmedTitle,
        description: trimmedDescription,
      };

      if (categoryId) {
        payload.category = categoryId;
      }

      const { data: createdTask } = await API.post("/tasks", payload);

      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setCompletionToast("Task created");
      setInfoMessage("Task created.");
      setIsCreateModalOpen(false);
    } catch (error) {
      if (error instanceof Error && !error.response) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(getErrorMessage(error, "Unable to create task."));
      }
    } finally {
      setIsCreateTaskSubmitting(false);
    }
  };

  const handleSaveEdit = async (taskId) => {
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setErrorMessage("Title cannot be empty.");
      return;
    }

    try {
      setBusyTaskId(taskId);

      const { data } = await API.put(`/tasks/${taskId}`, {
        title: trimmedTitle,
        description: editDescription.trim(),
      });

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data : task))
      );

      cancelEditing();
      setInfoMessage("Task updated.");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to update task."));
    } finally {
      setBusyTaskId("");
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === "pending" ? "completed" : "pending";

    try {
      setBusyTaskId(task._id);

      const { data } = await API.put(`/tasks/${task._id}`, {
        status: nextStatus,
      });

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) => (currentTask._id === task._id ? data : currentTask))
      );

      const nextMessage =
        nextStatus === "completed" ? "Task marked complete" : "Task moved to pending";

      setInfoMessage(`${nextMessage}.`);
      setCompletionToast(nextMessage);
      closeMenu();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to update task status."));
    } finally {
      setBusyTaskId("");
    }
  };

  const handleDelete = async (taskId) => {
    try {
      setBusyTaskId(taskId);

      await API.delete(`/tasks/${taskId}`);
      setTasks((currentTasks) => currentTasks.filter((task) => task._id !== taskId));

      if (editingTaskId === taskId) {
        cancelEditing();
      }

      setInfoMessage("Task deleted.");
      closeMenu();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete task."));
    } finally {
      setBusyTaskId("");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="ambient ambient-three" />

      <div className={`dashboard-shell ${isCreateModalOpen ? "is-blurred" : ""}`}>
        <header className="panel dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Task Pilot</p>
            <h1 className="dashboard-title">My Tasks</h1>
          </div>

          <div className="dashboard-stats">
            <div>
              <span className="stat-label">Total</span>
              <strong>{tasks.length}</strong>
            </div>
            <div>
              <span className="stat-label">Pending</span>
              <strong>{pendingCount}</strong>
            </div>
            <div>
              <span className="stat-label">Done</span>
              <strong>{completedCount}</strong>
            </div>
            <button className="btn btn-create" onClick={openCreateModal} type="button">
              <span className="plus-glyph" aria-hidden="true">
                +
              </span>
              Create
            </button>
            <button className="btn btn-outline" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}
        {infoMessage ? <p className="notice info">{infoMessage}</p> : null}

        <div className="dashboard-grid dashboard-grid-single">
          <section className="panel board-panel board-panel-full">
            <div className="board-header board-header-column">
              <h2>{activeCategoryName}</h2>
              <p className="board-subtitle">Showing {orderedTasks.length} tasks</p>
            </div>

            <div className="category-strip" role="tablist" aria-label="Task categories">
              {categoryFilters.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategoryId === category._id}
                  className={`category-chip ${activeCategoryId === category._id ? "active" : ""}`}
                  onClick={() => setActiveCategoryId(category._id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {isLoading ? <p className="empty-state">Loading tasks...</p> : null}

            {!isLoading && orderedTasks.length === 0 ? (
              <p className="empty-state">No tasks for this category yet.</p>
            ) : null}

            <div className="task-list">
              {orderedTasks.map((task) => {
                const isEditing = editingTaskId === task._id;
                const isBusy = busyTaskId === task._id;

                return (
                  <article
                    key={task._id}
                    className={`task-card ${task.status === "completed" ? "is-completed" : ""}`}
                  >
                    <div className="task-card-top">
                      <label className="task-check">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={() => handleToggleStatus(task)}
                          disabled={isBusy}
                        />
                        <span>{task.status === "completed" ? "Completed" : "Mark complete"}</span>
                      </label>

                      <div className="task-top-right">
                        <span className="task-time">Updated {formatDate(task.updatedAt)}</span>
                        {!isEditing ? (
                          <div className="task-menu-container">
                            <button
                              className="menu-trigger"
                              type="button"
                              aria-label="Task options"
                              aria-haspopup="menu"
                              aria-expanded={menuTaskId === task._id}
                              aria-controls={`task-menu-${task._id}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuTaskId((currentMenuTaskId) =>
                                  currentMenuTaskId === task._id ? "" : task._id
                                );
                              }}
                            >
                              <span className="menu-trigger-glyph" aria-hidden="true">
                                ⋮
                              </span>
                            </button>
                            {menuTaskId === task._id ? (
                              <div className="task-menu" role="menu" id={`task-menu-${task._id}`}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => startEditingTask(task)}
                                  disabled={isBusy}
                                >
                                  Edit
                                </button>
                                <button
                                  className="danger-item"
                                  type="button"
                                  role="menuitem"
                                  onClick={() => handleDelete(task._id)}
                                  disabled={isBusy}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="task-edit-mode">
                        <input
                          className="input-field"
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          placeholder="Task title"
                        />
                        <textarea
                          className="input-field text-area"
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                          placeholder="Task description"
                        />
                        <div className="task-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => handleSaveEdit(task._id)}
                            type="button"
                            disabled={isBusy}
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="btn btn-ghost"
                            onClick={cancelEditing}
                            type="button"
                            disabled={isBusy}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{task.title}</h3>
                        <p className="task-category-tag">{getTaskCategoryName(task)}</p>
                        {task.description ? (
                          <p className="task-description">{task.description}</p>
                        ) : (
                          <p className="task-description empty">No description</p>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <section
            className="create-modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="create-modal-header">
              <div>
                <p className="auth-eyebrow">Create +</p>
                <h2 id="create-task-title">Create Task</h2>
              </div>
              <button className="btn btn-ghost" type="button" onClick={closeCreateModal}>
                Close
              </button>
            </div>

            <form className="task-form" onSubmit={handleCreateTask}>
              <label className="input-label" htmlFor="create-task-title-input">
                Title
              </label>
              <input
                id="create-task-title-input"
                className="input-field"
                type="text"
                value={createTitle}
                onChange={(event) => setCreateTitle(event.target.value)}
                placeholder="Plan release notes"
                autoFocus
              />

              <label className="input-label" htmlFor="create-task-description-input">
                Description
              </label>
              <textarea
                id="create-task-description-input"
                className="input-field text-area"
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                placeholder="Add context, blockers, and checklist"
              />

              <label className="input-label" htmlFor="create-task-category-select">
                Category
              </label>
              <select
                id="create-task-category-select"
                className="input-field"
                value={createCategorySelection}
                onChange={(event) => setCreateCategorySelection(event.target.value)}
              >
                <option value={ALL_CATEGORY_ID}>All Tasks</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
                <option value={CREATE_NEW_CATEGORY_ID}>Create category...</option>
              </select>

              {createCategorySelection === CREATE_NEW_CATEGORY_ID ? (
                <>
                  <label className="input-label" htmlFor="create-new-category-input">
                    New Category Name
                  </label>
                  <input
                    id="create-new-category-input"
                    className="input-field"
                    type="text"
                    maxLength={CATEGORY_NAME_LIMIT}
                    value={createCategoryName}
                    onChange={(event) => setCreateCategoryName(event.target.value)}
                    placeholder="Work, Personal, Deep Focus"
                  />
                  <p className="modal-hint">
                    New categories are created while creating the task.
                  </p>
                </>
              ) : null}

              <div className="create-modal-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={closeCreateModal}
                  disabled={isCreateTaskSubmitting}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={isCreateTaskSubmitting}>
                  {isCreateTaskSubmitting ? "Creating..." : "Create +"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {completionToast ? <div className="status-toast">{completionToast}</div> : null}
    </div>
  );
}

export default Dashboard;
