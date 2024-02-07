# douyin.operator

这是一个抖音自动运营工具，纯Javascript编写，使用<a href="https://www.tampermonkey.net/" style="text-decoration: none;" target="_blank"> <img alt="tampermonkey/油猴" src="https://www.tampermonkey.net/images/ape.svg" width="15px"> tampermonkey</a> 扩展抖音官网，
其中包含视频和作者、评论和回复人的条件筛选，可以自动刷视频和自定义评论、自定义回复，其中评论和回复可以与服务器端进行交互，推荐使用HTTP代理绕过抖音的跨域验证，此处不包含服务端的响应程序，可随意定制。

我选择轻量级Http代理工具 <a href="https://wproxy.org/whistle/">whistle</a>，服务端并集成了ChatGPT，测试效果还不错！另外注明抖音每个账号每天评论有上限，大约200条左右。