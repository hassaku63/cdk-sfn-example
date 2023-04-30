export interface StateMachineExecution {
    Id: string
    Input: any
    Name: string
    RoleArn: string
    StartTime: string
}

export interface StateMachineContext {
    Execution: StateMachineExecution,
    State: {
        EnteredTime: string
        Name: string
        RetryCount: number
    },
    StateMachine: {
        Id: string
        Name: string
    },
    Task: {
        Token: string
    }
}