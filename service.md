# Service 服务

目前提供以下 Service 供使用：

+ 微信临时号
+ 微信企业号
+ Bark
+ Pushover
+ 快知
+ 自定义 Webhook

## 自定义 Service

如果上述已有的 Service 无法满足你的要求，你可以自定义自己的 Service，也欢迎你提相关的 Pull Request。

自定义一个 Service 只需要在 services 文件夹下新建一个 .py 文件，做好相应声明并实现一个 process 函数即可

### 声明 service_name

文件应有一个 `service_name` 变量，此变量值应与文件名相同，并且不应在任何内部函数中修改

service_name 值应为 slug 格式，命名不应与 Python 标准库常用库相同，不应与 shortcuts 文件夹下内容相同，不应使用通用词汇

### 声明 params 与 required_params

文件应实现一个 `params` 元组变量和一个 `required_params` 元组变量，只有 `params` 中定义的变量才能被预设和传入至你的 process 函数，而 `required_params` 将用于分发前检查，只有包含所有 `required_params` 声明所要求的参数的请求才会被下发至 process 函数处理。

请注意以下事项：

1. Service 内部可以提供值的都不要声明为 required
2. 如果分场景，有的场景必要有的不是则不要声明为 required 而是在 process 函数中自行实现检查逻辑
3. 任何参数不能以 `_` 开头且不能为 `logger`、`delay` 与 `at`
4. 参数应为小写字母并以下划线分隔相应单词

如果可接收任意参数请将已知可能需要的参数列出至 `params` 声明并追加 `__all__` 作为 `params` 声明内容，如果没有需要的参数或没有必须的参数则须将相应声明为空元组（`()`）。

### process

1. process 函数只接收命名参数，且最后应以 `**kwargs` 作为最后一个参数以避免未来的升级传入冗余参数而导致 Service 不可用
2. process 函数接收的参数都应在 params 声明中预先声明并遵从相应规则
3. process 函数必须返回一个可序列化的 dict，这个 dict 应该是由 `shortcuts.result.Success/Fail` 对象的 `as_dict` 方法生成。对于返回错误的情形，必须返回 `code` 和 `message`，建议返回 `data` 存储错误的原始信息
4. process 函数的 `code` 和 `message` 都必须是字符串，`code` 必须以 `service_name:`开头，任何两个地方不应返回相同的错误码

### 运行机制讲解

API 请求 /push -> 进入 shortcuts.dispatcher.dispatch 整理任务 -> 通过 Celery 异步调用 push.tasks.dispatch -> 请求最终 Service
