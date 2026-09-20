export const apiModules = [
  {
    name        : "Core",
    url         : process.env.NEXT_PUBLIC_API_URL,
    controllers : [
      {
        name    : "auth",
        actions : [
          { actionName: "Login",    actionURL: "login" },
          { actionName: "Register", actionURL: "register" },
        ],
      },
      {
        name    : "users",
        actions : [
          { actionName: "GetAll",  actionURL: "" },
          { actionName: "Create",  actionURL: "" },
        ],
      },
    ],
  },
] as const;
