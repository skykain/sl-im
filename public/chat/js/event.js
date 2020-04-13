import {getRequest, postRequest} from "./request.js";
import {
  user_get_unread_application_count,
  user_set_status,
  friend_send_cmd,
  group_send_cmd,
  friend_read_msg
} from "./api.js";
import {
  createSocketConnection,
  createMessage,
  socketEvent,
  wsOpen,
  wsReceive,
  wsError,
  wsClose,
  wsSend
} from "./socket.js";
import {getCookie, output, messageId} from "./util.js";

function ready() {
  layui.layim.on('ready', function (options) {
    getRequest(user_get_unread_application_count, {}, function (count) {
      if (count == 0) {
        return false;
      }
      layui.layim.msgbox(count)
    });

    var wsUrl = layui.jquery(".wsUrl").val();
    var webSocket = createSocketConnection(wsUrl, getCookie('IM_TOKEN'));
    socketEvent(webSocket);
  });
};

function toolCode() {
  layui.layim.on('tool(code)', function (insert, send, obj) {
    layer.prompt({
      title: '插入代码'
      , formType: 2
      , shade: 0
    }, function (text, index) {
      layer.close(index);
      insert('[pre class=layui-code]' + text + '[/pre]');
    });
  });
};

function userStatus() {
  layui.layim.on('online', function (status) {
    output(status, 'userStatus');
    let data = (status === 'hide') ? 0 : 1;
    postRequest(user_set_status, {status: data})
  });
}

function toMessage() {
  layui.layim.on('sendMessage', function (res) {
    output(res, 'toMessage');
    let cmd = (res.to.type === 'friend') ? friend_send_cmd : group_send_cmd;
    let data = {
      message_id: messageId(),
      from_user_id: res.mine.id,
      to_id: parseInt(res.to.id),
      content: res.mine.content
    };
    let msg = createMessage(cmd, data);
    wsSend(msg);
  });
};


var MessageActive = {
  setUserStatus: function (data) {
    output(data, 'setUserStatus');
    layui.layim.setFriendStatus(data.user_id, data.status)
  },
  getMessage: function (data) {
    output(data, 'getMessage');
    layui.layim.getMessage(data);
    if (data.type === 'friend') {
      let msg = createMessage(friend_read_msg, {
        'message_id': data.cid
      });
      wsSend(msg)
    }
  },
  onlineNumber: function (data) {
    layui.jquery("#onlineNumber").html(data)
  }
};

export {
  ready,
  toolCode,
  userStatus,
  MessageActive,
  toMessage
}
