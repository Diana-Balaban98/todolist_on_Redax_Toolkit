import {AppRootStateType} from "../../app/store";

export const IsLoggedInSelector = (state: AppRootStateType) => state.auth.isLoggedIn;
