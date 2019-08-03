# 指南

## 介绍

## 快速上手

### 基本概念

Account：账户，一个邮箱对应一个账户

Service：服务，是由 Uni-Push 官方提供的可直接接收推送的应用，任何一个 Pusher 最终都是由 Service 进行处理的

Preset：预设，是基于一个已有的 Pusher 并添加或覆盖一定的参数实现的  
Group: 组，由多个 Pusher 组合实现的，Group 中也可添加或覆盖其所保护的 Pusher 的参数

Pusher：每一个 Service / Preset / Group 都是一个 Pusher，Pusher 也是实质上可以利用 API 进行推送的唯一单位

## 参数

### 定义

本节中的参数指经过一层层的 Pusher 包装组合最终传递给 Service 的参数。

预定义参数：进行 API 请求前就已经定义好的参数
外部参数：进行 API 请求时设定的参数

### 修改器

修改器的作用是修改上级定义的参数，修改器的使用极其灵活，理论上可以修改任何参数。

#### 一般使用

在 Preset 中设定预定义参数时可以使参数值包括类似 `<_1>` 的字符串，之后利用修改器直接替换这个部分。

假如现在有着如下的参数定义

```json
{
  "content": "Test<_0>haha",
  "title": "Something<_1> Others"
}
```

修改器的参数名为 `_要替换的参数名_要替换的部分编号`，例如想要修改上述 `content` 中的 `<_0>` 即参数名为 `_content_0`，想要修改上述 `title` 中的 `<_1>` 则参数名为 `_title_1`。

因此，例如请求 API `/push/PusherID/?_content_0=CONTENT&_title_1=TITLE` 则实际向上传递的参数为

```json
{
  "content": "TestCONTENThaha",
  "title": "SomethingTITLE Others"
}
```

具体而言，修改器的参数名规则如下：

1. 预定义参数中类似 `<_1>` 字符串中 `_` 后的内容序号必须为数字
2. 修改器参数优先级高于普通参数，例如 Preset 预定义参数中定义了 `_test_1` 参数，则因其为修改器参数故会被提前，因此也会作用于请求时传入的 `test` 参数
3. 除 `_token` 保留参数外，可直接使用 `_something` 代替 `_something_0`，不过若同时定义了 `_something` 和 `_something_0` 则应用优先级是未定义的
4. 在 Preset 中可设定 `redefine_content` 配置将 URL 中的 content 配置为修改器

#### 组使用

当 Pusher 为 Group 时，修改器为 `组名.组参数`，其整体是一个修改器，并且组参数也可以是一个修改器。

如果传入外部参数时没有指定组名，则依赖参数映射将之转换为 `组名.组参数` 的形式。

例如你需要发送通知到 Service-1 和 Service-2。  
你通过 Preset-1 和 Preset-2 分别配置好了 Service-1 和 Service-2 的推送密钥，但 Service-1 还需要你提供一个 title 代表内容、Service-2 还需要你提供一个 content 代表内容。

你想推送的内容为「剩余XX元」，那么 Group 的配置可以有以下几种

**示例一：利用参数映射将参数映射为组参数**

包含的 Pushers 配置

```json
[
  {
    "name": "p1",
    "base_pusher": "Preset-1",
    "params": {
      "title": "剩余 <_0> 元"
    }
  },
  {
    "name": "p2",
    "base_pusher": "Preset-2",
    "params": {
      "content": "剩余 <_0> 元"
    }
  }
]
```

参数映射配置

```json
{
  "amount": [
    "p1._title",
    "p2._content"
  ]
}
```

假设你的 Group ID 为 G，则可请求 `/push/G/?amount=10` 即可实现需求
如果你设置了 redefine_content 配置为 amount，更可使用 `/push/G/10` 实现

**示例二：选择性使用配置的参数映射**

包含的 Pushers 配置

```json
[
  {
    "name": "p1",
    "base_pusher": "Preset-1",
    "params": {
      "title": "剩余 <_0> 元"
    }
  },
  {
    "name": "p2",
    "base_pusher": "Preset-2",
    "params": {
      "content": "剩余 <_0> 元"
    }
  }
]
```

参数映射配置

```json
{
  "amount": [
    "p1._title",
    "p2._content"
  ],
  "content: [
    "p1.title",
    "p2.content"
  ]
}
```

你可请求 `/push/G/?amount=10` 实现与上述相同的需求，也可请求 `/push/G?content=剩余9元，请注意充值` 使得发送的信息有一定的自定义

**示例三：不使用参数映射**

完全不配置 Pushers 中各 Pusher 的预定义参数，也不配置 Group 的参数映射

可以直接请求 `/push/G/?p1._title=9&p2.content=剩余9元，请注意充值` 实现向 Service-1 推送「剩余 9 元」而向 Service-2 推送「剩余9元，请注意充值」

## 自部署（后端）

Uni Push Backend 的开发框架为 Django，并使用 PostgreSQL 11 作为数据库，Redis 5 作为缓存与消息队列，Celery 用于异步事件分发。

### 下载代码

将代码下载于本地文件夹中，确保文件夹名为 `unipush`

```bash
git clone https://github.com/ImSingee/uni-push-backend unipush
```

### 环境配置 —— 安装 Python、Django、Celery

进入，利用 `virtualenv --python=3.7 venv` 新建一个虚拟环境，之后利用 `source venv/bin/activate` 激活，再利用 `pip install -r requirements.txt` 即可安装好 Python、Django 与 Celery

### 环境配置 —— 安装 PostgreSQL 与 Redis

可自行配置也可利用 Docker 启动一个 PostgreSQL 与 Redis，启动脚本为 `docker-compose.yml`，可以直接利用 `docker-compose up -d` 命令进行启动

::: tip
此 docker-compose 文件仅适用于本地调试，切勿在生产环境使用
:::

### 设置配置文件

将 `config.example.ini` 复制一份并命名为 `config.ini`，如果你的 PostgreSQL 与 Redis 是利用我提供的 docker 脚本构建的则可直接使用，否则需要修改配置文件设定好相关连接信息

### 迁移数据库

激活虚拟环境后，直接执行 `./manage.py migrate` 并稍等片刻即可完成迁移数据库

### 运行 Celery

如果你的环境是如我所述的方式配置的，则可利用 `./run-celery.sh` 直接执行 Celery，如果你用的 PyCharm 则更可直接在右上角的运行区域找到「Celery」直接运行，
否则你需要激活虚拟环境后利用 `celery -A unipush worker -l info` 命令手动启动

### 运行 Django

激活虚拟环境后，执行 `./manage.py runserver` 即可启动，如果你用的是 Pycharm 则可直接在右上角的运行区域找到「unipush」直接运行
