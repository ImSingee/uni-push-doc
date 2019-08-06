# API

## 约定

请求网址：

1. 请求网址中以 `:` 代表的是参数，实际请求时应替换为相应内容
2. 以中括号 `[]` 包裹的参数为可选参数，实际请求时可省略
3. 所有的请求网址均以 `/` 结束（有 GET 参数的则在 `/` 后加上参数）

请求体：

1. POST 参数可接收 application/json 和 application/x-www-form-urlencoded 类型的数据，但应在请求时的 Content-Type 进行明确说明

返回体：

1. success：bool 类型，代表请求是否成功
2. code：string 类型，"0" 代表请求成功，其他代表失败（失败的错误码不一定是数字）
3. message: string 类型，请求失败时返回失败原因（原因可能随时更改，故请使用 code 来判断错误类型
4. data：类型随具体接口而定，返回请求的结果或错误的详细信息

## 推送

### 发起推送

#### GET|POST /push/:pusher_id/[:content]/

参数:

+ pusher_id, 必选 - Pusher ID
+ content, 可选 - 参数中的 `content` 字段

GET 参数：可选 - 替换预设的推送参数

POST 参数：可选 - 替换预设的推送参数

::: tip content 参数

在 URL 中的 `:content` 部分是一个「快捷方式」，在 Preset 或 Group 中可以通过设定 `redefine_content` 配置来实现修改其代表的参数名（默认为 `content`）。

例如对 `{"title": "Foo", "content": "Bar"}` 这组参数而言，默认 content 会覆盖 `Bar`，而若将 redefine_content 定义为 `title` 则会覆盖 `Foo`
:::

::: tip 优先级
各类参数均支持自由覆盖，在相同参数多次出现时，遵从以下优先级

1. POST 请求体中的参数
2. URL 中的 `:content`
3. 请求网址中的 GET 参数
4. Preset 中的预定义参数
5. Service 中的预定义参数

:::

::: tip 延时请求

可以通过添加 delay 或 at 参数实现在一定时间以后或一个特定时间发起推送。

+ `delay`：设定延时，单位为秒，最多为 1 天（86400 秒）  
+ `at`：设定运行时间，格式为 `YYMMDDhhmm`，最多延迟 7 天，默认时区为中国（GMT+8），可通过使用`YYMMDDhhmm.UTC` 格式来使用 UTC 时间

注意这里设定的时间是进入推送队列的时间，实际推送到达时间会依据队列中任务数量和推送的业务执行时间而有一定的延迟

:::

### 取消推送

#### GET /revoke/task/:task_id/

<Badge text="需要授权" type="warn" vertical="middle"/>

参数:

+ task_id, 必选 - Task ID，来自于请求 Push API 时的返回

限制条件：

+ 只有发起任务的 Pusher 的所有者才有权取消

::: danger 等待开发

权限限制模块还未实现，目前只要是知道 task_id 的用户就可以取消任务

:::

局限性说明：

1. Group 会产生多个推送任务，如需取消需对各任务分别取消
2. 取消推送接口返回值只可能是成功，而无论实际任务是否存在、实际任务是否成功被取消
3. 只有处于等待中的任务可以被取消，已经完成或开始运行的任务无法被取消

## 用户操作

### 生成邀请码

#### POST /account/invite/:type/

参数：

+ type, 必选 - 可使用 `auto`|`referer`|`admin`，默认为 auto

成功返回：

+ quantity, Int - 生成的邀请码个数
+ codes, Array(Object) - 生成的邀请码信息数组，每个数组成员如下
  + code, String - 生成的邀请码
  + available_times, Int - 生成的邀请码可用次数
  + valid_to, Time - 生成的邀请码过期时间，null 代表永久有效

**[type=auto] 自动生成邀请码**  

POST 参数：

+ limit_email, 必选 - 限制邀请码必须被指定的邮箱使用
+ recaptcha_response, 可选 - Google Recaptcha V3 验证结果

该接口只可能返回一个邀请码

当设定为开放注册时可以利用此接口为指定的邮箱生成邀请码，此接口必须传入 limit_email，邀请码将仅限此邮箱使用。  
如后台设定开启了 Google Recaptcha，则需传入 recaptcha_response 参数用于进行真人验证

**[type=referer] 通过邀请生成邀请码** <Badge text="需要授权" type="warn" vertical="middle"/>

POST 参数：

+ quantity, 可选 - 生成的邀请码个数，默认为 1
+ limit_email, 可选 - 限制邀请码必须被指定的邮箱使用（设定此选项则 quantity 强制为 1）

此接口用于一个已经通过验证的用户邀请其他人使用

<!--

**[type=parner] 合作商生成邀请码** <Badge text="需要授权" type="warn" vertical="middle"/> <Badge text="Developing" type="error" vertical="middle"/>

POST 参数：

+ times, 可选 - 生成的邀请码可用次数，默认为 1（不能与 quantity 同时传入）
+ quantity, 可选 - 生成的邀请码个数，默认为 1（不能与 times 同时传入）
+ limit_email, 可选 - 限制邀请码必须被指定的邮箱使用（设定此选项则 quantity 与 times 强制为 1）
+ valid_time, 可选 - 生成的邀请码有效期，单位为秒

-->

**[type=admin] 管理员生成邀请码**  <Badge text="需要授权" type="warn" vertical="middle"/> <Badge text="Admin" type="error" vertical="middle"/>

POST 参数：

+ times, 可选 - 生成的邀请码可用次数，默认为 1（不能与 quantity 同时传入）
+ quantity, 可选 - 生成的邀请码个数，默认为 1（不能与 times 同时传入）
+ limit_email, 可选 - 限制邀请码必须被指定的邮箱使用（设定此选项则 quantity 与 times 强制为 1）
+ valid_time, 可选 - 生成的邀请码有效期，单位为秒
+ source, 可选 - 标记用户来源

### 利用邀请码创建用户

#### POST /account/user/create/

POST 参数：

+ code, 必选 - 邀请码
+ email, 必选 - 邮箱
+ password, 可选 - 密码

**[password] 为空的特殊情形**

此设定是为了以后可以支持无密码登录使用的，但目前只能通过密码进行身份认证，故 password 实际上是必选。  

### 激活用户

#### GET /account/user/confirm/:confirm_token/

参数：

+ confirm_token, 必选 - 用户激活 Token

此接口用于激活用户，如果注册后 24h 内未激活则该用户及相关信息会被彻底删除

**[confirm_token=force] 的特殊情形** <Badge text="需要授权" type="warn" vertical="middle"/> <Badge text="Admin" type="error" vertical="middle"/>

此接口用于给管理员以强制激活某用户使用

### 获取 Token （登录）

#### POST /account/user/login/

POST 参数

+ email, 必选 - 用户注册邮箱
+ password, 可选 - 密码

返回内容：

+ isLogin, Bool - 是否登录成功
+ isRegistered, Bool - 用户是否已注册
+ token, String - 用户 Token（仅登录成功会返回）

**[password] 为空的特殊情形**

此设定是为了以后可以支持一键登录、第三方登录等使用的，但目前只有密码登录这一种方式，故 password 实际上是必选。  

### 获取用户信息

## 列出 Pusher

### 获取 Service 列表
### 获取公开的 Preset 列表
### 获取自己的 Preset 列表
### 获取自己的 Group 列表

## 获取指定 Pusher 信息

### 获取指定 Service 信息
### 获取指定 Preset 信息
### 获取指定 Group 信息

## 新增 Pusher

### 新增 Preset
### 新增 Group

## 修改 Pusher

### 修改 Preset

### Group 增加 Pusher
目前一个 Group 最多包括 5 个 Pusher
### Group 修改 Pusher
### Group 删除 Pusher

### 将自己的 Preset/Group 设置为公开（shared）

条件：

1. base_pusher (Group 中所有 pusher 的 base_pusher) 必须为公开
2. 自身不能为 protected

注意：一旦设置为公开后该 Pusher 不可被修改、不可被取消公开，如需删除需要联系管理员发工单申请

## 删除可用服务

## 设置服务保护
