# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

---

# CdkSfnLambdaInvokeExampleStack

`TestStateMachine` ステートマシンをデプロイして、実際に得られる ASL は以下。

```json
{
  "StartAt": "AppendContext",
  "States": {
    "AppendContext": {
      "Type": "Pass",
      "Parameters": {
        "data.$": "$",
        "execution.$": "$$"
      },
      "Next": "FirstTask"
    },
    "FirstTask": {
      "Next": "SecondTask",
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Type": "Task",
      "Resource": "arn:aws:lambda:<region>:<aws-account>:function:CdkSfnLambdaInvokeExampleStack-First"
    },
    "SecondTask": {
      "End": true,
      "Retry": [
        {
          "ErrorEquals": [
            "Lambda.ServiceException",
            "Lambda.AWSLambdaException",
            "Lambda.SdkClientException"
          ],
          "IntervalSeconds": 2,
          "MaxAttempts": 6,
          "BackoffRate": 2
        }
      ],
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:<region>:<aws-account>:function:CdkSfnLambdaInvokeExampleStack-Second",
        "Payload.$": "$"
      }
    }
  }
}
```

FirstTask と SecondTask ではどちらも Lambda タスクを呼び出しているが、ASL での書き方が異なる。

| TaskName | Type | Resource | payloadResponseOnly パラメータ(CDK) |
| :------- | :--- | :------- | :-------------------------------- |
| FirstTask | "Task" | (Function ARN) | true |
| SecondTask | "Task" | "arn:aws:states:::lambda:invoke" | false (default) |

`payloadResponseOnly` を `false` に指定する(=`arn:aws:states:::lambda:invoke` を用いたe) SecondTask では、タスクステートの入出力の指定方法に決まりがある。

参考: https://docs.aws.amazon.com/step-functions/latest/dg/connect-lambda.html

他方、FirstTask では特に決まりを意識する必要はなく、タスクの入出力は (`InputPath` や `ResultPath` といった入出力を加工するパラメータを指定しない限り）そのまま Lambda ハンドラの入出力と一致するためわかりやすい。

SecondTask の場合、タスクが実際に返したペイロード部分のみに用がある場合は `ResultPath` あるいは `OutputPath` を指定することでステートの出力を整形する必要がある。
