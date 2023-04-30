import { Handler, Context } from 'aws-lambda';
import { StateMachineExecution } from "./util";

interface FirstHandlerInput {
    data: {
        name: string
    }
    execution: StateMachineExecution
}

export const firstHandler: Handler = async (
    event: FirstHandlerInput,
    context: Context,
) => {
    console.log(event);

    // $.data.message キーを追加するだけのハンドラ
    const result = JSON.parse(JSON.stringify(event));
    result.data.message = `hello, ${event.data.name}`;
    return result;
};

interface SecondHandlerInput {
    data: {
        name: string
        message: string
        success: boolean
    }
    execution: StateMachineExecution
}

export const secondHandler: Handler = async (
    event: SecondHandlerInput,
    context: Context,
) => {
    console.log(event);

    // $.data.success キーを追加するだけのハンドラ
    const result = JSON.parse(JSON.stringify(event));
    const prob = Math.random()
    const success = (prob > 0.5) ? true : false;
    result.data.success = success;
    return result;
};