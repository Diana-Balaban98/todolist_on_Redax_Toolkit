import {todolistsAPI, TodolistType} from "../../api/todolists-api";
import {appActions, RequestStatusType} from "../../app/app-reducer";
import {handleServerNetworkError} from "../../utils/error-utils";
import {AppThunk} from "../../app/store";
import {createSlice, current, PayloadAction} from "@reduxjs/toolkit";
import {fetchTasksTC} from "./tasks-reducer";


export const slice = createSlice({
    name: "todolists",
    initialState: [] as TodolistDomainType[],
    reducers: {
        setTodolists(state, action: PayloadAction<{ todolists: TodolistType[] }>) {
            return action.payload.todolists.map(tl => ({...tl, filter: "all", entityStatus: "idle"}))
        },
        removeTodolist(state, action: PayloadAction<{ id: string }>) {
            const findIdTodolist = state.findIndex(tl => tl.id === action.payload.id)

            if (findIdTodolist !== -1) {
                state.splice(findIdTodolist, 1)
            }
        },
        addTodolist(state, action: PayloadAction<{ todolist: TodolistType }>) {
            state.unshift({...action.payload.todolist, filter: "all", entityStatus: "idle"})
        },
        changeTodolistTitle(state, action: PayloadAction<{ id: string, title: string }>) {
            const findIdTodolist = state.findIndex(tl => tl.id === action.payload.id)

            if (findIdTodolist !== -1) {
                state[findIdTodolist].title = action.payload.title
            }
        },
        changeTodolistFilter(state, action: PayloadAction<{ id: string, filter: FilterValuesType }>) {
            const findIdTodolist = state.findIndex(tl => tl.id === action.payload.id)

            if (findIdTodolist !== -1) {
                state[findIdTodolist].filter = action.payload.filter
            }
        },
        clearTodolists(state, action) {
            return [];
        },
        changeTodolistEntityStatus(state, action: PayloadAction<{ id: string, entityStatus: RequestStatusType }>) {
            const findIdTodolist = state.findIndex(tl => tl.id === action.payload.id)

            if (findIdTodolist !== -1) {
                state[findIdTodolist].entityStatus = action.payload.entityStatus
            }
        }
    }
})

export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;


// thunks
export const fetchTodolistsTC = (): AppThunk => {
    return (dispatch) => {
        dispatch(appActions.setAppStatus({status: "loading"}));
        todolistsAPI
            .getTodolists()
            .then((res) => {
                dispatch(todolistsActions.setTodolists({todolists: res.data}));
                dispatch(appActions.setAppStatus({status: "succeeded"}));
                return res.data;
            }).then(todolists => {
                 todolists.forEach(tl => {
                    dispatch(fetchTasksTC(tl.id))
                 })
            }).catch(error => {
                handleServerNetworkError(error, dispatch);
            });
    };
};
export const removeTodolistTC = (todolistId: string): AppThunk => {
    return (dispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(appActions.setAppStatus({status: "loading"}));
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistsActions.changeTodolistEntityStatus({id: todolistId, entityStatus: "loading"}));
        todolistsAPI.deleteTodolist(todolistId).then((res) => {
            dispatch(todolistsActions.removeTodolist({id: todolistId}));
            //скажем глобально приложению, что асинхронная операция завершена
            dispatch(appActions.setAppStatus({status: "succeeded"}));
        });
    };
};
export const addTodolistTC = (title: string): AppThunk => {
    return (dispatch) => {
        debugger
        dispatch(appActions.setAppStatus({status: "loading"}));
        todolistsAPI.createTodolist(title).then((res) => {
            dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}));
            dispatch(appActions.setAppStatus({status: "succeeded"}));
        });
    };
};
export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
    return (dispatch) => {
        todolistsAPI.updateTodolist(id, title).then((res) => {
            dispatch(todolistsActions.changeTodolistTitle({id, title}));
        });
    };
};

export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType;
    entityStatus: RequestStatusType;
};
