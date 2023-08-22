import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from "../../api/todolists-api";
import {AppRootStateType, AppThunk} from "../../app/store";
import {handleServerAppError, handleServerNetworkError} from "../../utils/error-utils";
import {appActions} from "app/app-reducer";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {todolistsActions} from "./todolists-reducer";

const initialState: TasksStateType = {};

const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {
        setTasks(state, action: PayloadAction<{ tasks: TaskType[] }>) {
            action.payload.tasks.forEach(t => {
                state[t.todoListId] = action.payload.tasks
            })
        },
        addTask(state, action: PayloadAction<{ task: TaskType }>) {
            state[action.payload.task.todoListId].unshift(action.payload.task)
        },
        removeTask(state, action: PayloadAction<{ taskId: string, todolistId: string }>) {
            const tasks = state[action.payload.todolistId];
            const findIndexTask = tasks.findIndex(t => t.id === action.payload.taskId);

            if (findIndexTask !== -1) {
                tasks.splice(findIndexTask, 1)
            }
        },
        updateTask(state, action: PayloadAction<{
            taskId: string,
            model: UpdateDomainTaskModelType,
            todolistId: string
        }>) {
            const tasks = state[action.payload.todolistId];
            const findIndexTask = tasks.findIndex(t => t.id === action.payload.taskId);

            if (findIndexTask !== -1) {
                tasks[findIndexTask] = {...tasks[findIndexTask], ...action.payload.model};
            }
        }
    },
    extraReducers: builder => {
        builder
            .addCase(todolistsActions.setTodolists, (state, action) => {
            action.payload.todolists.forEach(tl => {
                state[tl.id] = [];
            });
        }).addCase(todolistsActions.addTodolist, (state, action) => {
            state[action.payload.todolist.id] = []
        }).addCase(todolistsActions.removeTodolist, (state, action) => {
            delete state[action.payload.id]
        })
    }
})

export const tasksReducer = slice.reducer;
export const tasksActions = slice.actions;


// thunks
export const fetchTasksTC =
    (todolistId: string): AppThunk =>
        (dispatch) => {
            dispatch(appActions.setAppStatus({status: "loading"}));
            todolistsAPI.getTasks(todolistId).then((res) => {
                const tasks = res.data.items;
                dispatch(tasksActions.setTasks({tasks}));
                dispatch(appActions.setAppStatus({status: "succeeded"}));
            });
        };
export const removeTaskTC =
    (taskId: string, todolistId: string): AppThunk =>
        (dispatch) => {
            todolistsAPI.deleteTask(todolistId, taskId).then((res) => {
                const action = tasksActions.removeTask({taskId, todolistId});
                dispatch(action);
            });
        };
export const addTaskTC =
    (title: string, todolistId: string): AppThunk =>
        (dispatch) => {
            dispatch(appActions.setAppStatus({status: "loading"}));
            todolistsAPI
                .createTask(todolistId, title)
                .then((res) => {
                    if (res.data.resultCode === 0) {
                        const task = res.data.data.item;
                        const action = tasksActions.addTask({task});
                        dispatch(action);
                        dispatch(appActions.setAppStatus({status: "succeeded"}));
                    } else {
                        handleServerAppError(res.data, dispatch);
                    }
                })
                .catch((error) => {
                    handleServerNetworkError(error, dispatch);
                });
        };
export const updateTaskTC =
    (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string): AppThunk =>
        (dispatch, getState: () => AppRootStateType) => {
            const state = getState();
            const task = state.tasks[todolistId].find((t) => t.id === taskId);
            if (!task) {
                //throw new Error("task not found in the state");
                console.warn("task not found in the state");
                return;
            }

            const apiModel: UpdateTaskModelType = {
                deadline: task.deadline,
                description: task.description,
                priority: task.priority,
                startDate: task.startDate,
                title: task.title,
                status: task.status,
                ...domainModel,
            };

            todolistsAPI
                .updateTask(todolistId, taskId, apiModel)
                .then((res) => {
                    if (res.data.resultCode === 0) {
                        const action = tasksActions.updateTask({taskId, model: domainModel, todolistId});
                        dispatch(action);
                    } else {
                        handleServerAppError(res.data, dispatch);
                    }
                })
                .catch((error) => {
                    handleServerNetworkError(error, dispatch);
                });
        };

// types
export type UpdateDomainTaskModelType = {
    title?: string;
    description?: string;
    status?: TaskStatuses;
    priority?: TaskPriorities;
    startDate?: string;
    deadline?: string;
};
export type TasksStateType = {
    [key: string]: TaskType[];
};
