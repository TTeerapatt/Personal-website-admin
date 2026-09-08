import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

const authAPI = {

    login(email: string, password: string) {
        return apiServices
            .post(
                `auth/login`,
                { email, password },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
            .then((res) => validateOrThrowApiResponse(res))
            .catch((err) => {
                console.log("Error login:", err);
                return {
                    status: "failed",
                    errMessage:
                        err?.message ||
                        err?.errMessage ||
                        (typeof err === "string" ? err : null) ||
                        "Login failed",
                    error: err,
                };
            });
    },

    getMe() {
        return apiServices
            .get(
                `auth/me`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            )
            .then((res) => validateOrThrowApiResponse(res))
            .catch((err) => {
                console.log("Error getMe:", err);
                return {
                    status: "failed",
                    errMessage:
                        err?.message ||
                        err?.errMessage ||
                        (typeof err === "string" ? err : null) ||
                        "Failed to fetch user data",
                    error: err,
                };
            });
    },

}

export default authAPI;