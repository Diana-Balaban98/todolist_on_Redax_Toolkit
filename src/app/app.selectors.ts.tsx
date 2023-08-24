import {AppRootStateType} from "./store";

export const isInitializedSelector = (state: AppRootStateType) => state.app.isInitialized;
export const isStatusSelector = (state: AppRootStateType) => state.app.status;
export const isErrorSelector = (state: AppRootStateType) => state.app.error;