import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as aws_sfn from "aws-cdk-lib/aws-stepfunctions";
import * as aws_sfn_tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface CreateNodeFunctionProps {
  functionName: string,
  handler: string,
  entry: string,
}

export class CdkSfnLambdaInvokeExampleStack extends cdk.Stack {
  readonly lambdaFunctions: aws_lambda.IFunction[];

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    this.lambdaFunctions = [];

    /**
     * Functions
     */
    const firstFunction = this.newNodeFunction(this, "FirstFunction", {
      functionName: 'First',
      handler: "firstHandler",
      entry: "handlers/test-statemachine.ts",
    });

    const secondFunction = this.newNodeFunction(this, "SecondFunction", {
      functionName: 'Second',
      handler: "secondHandler",
      entry: "handlers/test-statemachine.ts",
    });

    /**
     * StateMechine
     * 
     * LambdaInvoke のタスク定義において、 `payloadResponseOnly` パラメータの値いによって
     * 生成される ASL がどうなるかの違いを確認するサンプル
     */
    const definition = 
      new aws_sfn.Pass(this, 'AppendContext', {
        parameters: {
          'data': aws_sfn.JsonPath.stringAt('$'),
          'execution': aws_sfn.JsonPath.stringAt('$$.Execution')
        }
      })
      .next(new aws_sfn_tasks.LambdaInvoke(this, 'FirstTask', {
        lambdaFunction: firstFunction,
        /**
         * payloadResponseOnly = false の場合、
         * ステートマシンから見たハンドラの入出力が event, return の値と一致する。
         * 個人的には、L2 Construct による抽象化が透過的なので読み書きしやすく理解しやすい印象。
         * こちらの方がより直感的な書き方で、推奨したい
         */
        payloadResponseOnly: true,
      }))
      .next(new aws_sfn_tasks.LambdaInvoke(this, 'SecondTask', {
        lambdaFunction: secondFunction,
        /**
         * payloadResponseOnly = false の場合、
         * ステートマシンから見たハンドラの入出力は event, return の値と一致しない。
         * Resource = "arn:aws:states:::lambda:invoke" で ASL が生成される
         * link: https://docs.aws.amazon.com/step-functions/latest/dg/connect-lambda.html
         * 
         * ハンドラの戻り値は、ステートから見ると '$.Payload' の値に対応する。
         * また '$.SdkHttpMetadata' といったメタデータなどのキー構造が追加されている
         */
        payloadResponseOnly: false,  // default
      }));

    const stateMachine = new aws_sfn.StateMachine(this, 'TestStateMachine', {
      definition: definition,
    })
  }

  public newNodeFunction(scope: Construct, id: string, props: CreateNodeFunctionProps): aws_lambda.IFunction {
    const f = new NodejsFunction(this, id, {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      functionName: `${cdk.Stack.of(scope).stackName}-${props.functionName}`,
      handler: props.handler,
      entry: props.entry
    })
    this.lambdaFunctions.push(f);
    return f;
  }
}

