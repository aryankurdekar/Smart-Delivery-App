import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Screen, Pill } from "../components/ui";
import { socket } from "../services/socket";
import { API } from "../services/api";

const QUICK_REPLIES = [
  { text: "Where is my order?", query: "status" },
  { text: "What is my OTP?", query: "otp" },
  { text: "Is my order delayed?", query: "delay" },
  { text: "Talk to support agent", query: "agent" },
];

const BOT_NAME = "Riya";
const AGENT_NAME = "Vivek";

export default function ChatScreen({ orders, onBack }) {
  const { colors, spacing, radii, typography } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "support",
      text: "Hello! I'm Riya from Customer Support. How can I help you today?",
      time: "10:00 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [isConnectingAgent, setIsConnectingAgent] = useState(false);
  const [isLive, setIsLive] = useState(socket.connected);
  const flatListRef = useRef(null);

  const supportDisplayName = agentConnected ? AGENT_NAME : BOT_NAME;

  const getLatestActiveOrder = () => {
    if (!orders || orders.length === 0) return null;
    const active = orders.filter(
      (o) => o.status !== "Delivered" && o.status !== "Cancelled"
    );
    return active.length > 0 ? active[active.length - 1] : null;
  };

  const appendMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const connectLiveAgent = () => {
    if (agentConnected || isConnectingAgent) return;

    setIsConnectingAgent(true);
    appendMessage({
      id: Date.now().toString(),
      sender: "support",
      text: "Connecting you to a live support agent…",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    setTimeout(() => {
      setAgentConnected(true);
      setIsConnectingAgent(false);
      appendMessage({
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: `Hi! I'm ${AGENT_NAME}, Senior Support Specialist. I've joined this chat and can see your account. How can I help you right now?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }, 1800);
  };

  const sendResponse = (queryText) => {
    if (
      (queryText === "agent" ||
        queryText.includes("agent") ||
        queryText.includes("human") ||
        queryText.includes("person")) &&
      !agentConnected &&
      !isConnectingAgent
    ) {
      connectLiveAgent();
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      let replyText = "";
      const activeOrder = getLatestActiveOrder();
      const fromAgent = agentConnected;

      if (queryText.includes("hi") || queryText.includes("hello") || queryText.includes("hey")) {
        replyText = fromAgent
          ? `Hello! ${AGENT_NAME} here. Tell me what's going on with your delivery and I'll sort it out.`
          : "Hello! I can help you track packages, check OTPs, or connect you to a live agent.";
      } else if (
        queryText === "status" ||
        queryText.includes("status") ||
        queryText.includes("track") ||
        queryText.includes("where")
      ) {
        if (activeOrder) {
          replyText = `Your Order #${activeOrder.id} (${activeOrder.type === "shop" ? "Store" : "Courier"}) is **${activeOrder.status}**. Rider: ${activeOrder.partnerName || "being assigned"}. ETA: ${activeOrder.eta || "soon"}.`;
        } else {
          replyText = "You don't have any active deliveries. Place a new order from the home screen anytime.";
        }
      } else if (queryText === "otp" || queryText.includes("otp") || queryText.includes("code")) {
        if (activeOrder) {
          replyText = `OTP for Order #${activeOrder.id}: **${activeOrder.otp}**. Share it only when the rider arrives.`;
        } else {
          replyText = "OTP codes are generated only for active deliveries. I don't see one on your account now.";
        }
      } else if (queryText === "delay" || queryText.includes("delay") || queryText.includes("late")) {
        if (activeOrder) {
          replyText = fromAgent
            ? `I've flagged Order #${activeOrder.id} for priority. Current ETA: ${activeOrder.eta || "15 mins"}. Rider contact: ${activeOrder.partnerPhone || "will be shared shortly"}.`
            : `Order #${activeOrder.id} ETA is ${activeOrder.eta || "15 Minutes"}. I'll monitor this for delays.`;
        } else {
          replyText = "No pending orders on file. Let me know if you need anything else.";
        }
      } else if (fromAgent) {
        replyText =
          "I've noted your message. If this is about a refund or damaged item, I'll raise a ticket and follow up within 2 hours. Anything else I can check now?";
      } else {
        replyText =
          "Thanks for your message. Ask about order status, OTP, delays, or tap 'Talk to support agent' for a live specialist.";
      }

      replyText = replyText.replace(/\*\*/g, "");

      appendMessage({
        id: (Date.now() + 1).toString(),
        sender: fromAgent ? "agent" : "support",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      setIsTyping(false);
    }, agentConnected ? 900 : 1200);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const textValue = inputText;

    appendMessage({
      id: Date.now().toString(),
      sender: "user",
      text: textValue,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setInputText("");

    if (isLive && !agentConnected) {
      // Real-time path: persist to the backend; the support/bot reply arrives
      // back over Socket.IO (and reaches any other connected device too).
      setIsTyping(true);
      API.sendChatMessage("user", textValue).catch(() => setIsTyping(false));
      setTimeout(() => setIsTyping(false), 5000); // safety if no reply arrives
    } else {
      // Offline (or talking to the simulated live agent): use the local bot.
      sendResponse(textValue.toLowerCase());
    }
  };

  const handleQuickReplyPress = (reply) => {
    appendMessage({
      id: Date.now().toString(),
      sender: "user",
      text: reply.text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    sendResponse(reply.query);
  };

  // Real-time chat: load persisted history and subscribe to live pushes from
  // the backend (Socket.IO). Falls back to the local bot when offline.
  useEffect(() => {
    const onConnect = () => setIsLive(true);
    const onDisconnect = () => setIsLive(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    let mounted = true;
    (async () => {
      try {
        const history = await API.getChatMessages();
        if (mounted && Array.isArray(history) && history.length > 0) {
          setMessages(
            history.map((m, i) => ({
              id: `srv-${i}-${m.timestamp || ""}`,
              sender: m.sender,
              text: m.text,
              time: m.timestamp || "",
            }))
          );
        }
      } catch {
        /* offline — keep the local welcome message */
      }
    })();

    const onIncoming = (m) => {
      if (!m || m.sender === "user") return; // our own bubble is added locally
      setIsTyping(false);
      appendMessage({
        id: `rt-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        sender: m.sender,
        text: m.text,
        time: m.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    };
    socket.on("receive_chat_message", onIncoming);

    return () => {
      mounted = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_chat_message", onIncoming);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping, isConnectingAgent]);

  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === "user";
    const isAgent = item.sender === "agent";
    const avatarIcon = isUser ? "person" : isAgent ? "headset" : "person-circle";

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.supportRow]}>
        {!isUser && (
          <View style={[styles.supportAvatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name={avatarIcon} size={18} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            { borderRadius: radii.lg },
            isUser
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.supportBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
          ]}
        >
          <Text style={[typography.t("body", "regular"), isUser ? { color: "#FFFFFF" } : { color: colors.text }]}>
            {item.text}
          </Text>
          <Text
            style={[
              typography.t("caption", "regular"),
              styles.timeText,
              isUser ? { color: "#FFFFFFB3" } : { color: colors.textMuted },
            ]}
          >
            {item.time}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.userAvatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name={avatarIcon} size={18} color={colors.primary} />
          </View>
        )}
      </View>
    );
  };

  const typingLabel = isConnectingAgent
    ? "Connecting to live agent…"
    : `${supportDisplayName} is typing...`;

  return (
    <Screen edges={["top"]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, paddingHorizontal: spacing.gutter }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[typography.t("subtitle", "semibold"), { color: colors.text }]}>Support Chat</Text>
          <View style={styles.onlineStatusRow}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: agentConnected ? colors.admin : isConnectingAgent ? colors.warning : colors.success },
              ]}
            />
            <Text style={[typography.t("caption", "medium"), { color: colors.textSecondary }]}>
              {agentConnected
                ? `${AGENT_NAME} (Live Agent)`
                : isConnectingAgent
                ? "Connecting…"
                : `${BOT_NAME} (Online)`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.infoBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() =>
            Alert.alert(
              "Support Desk",
              agentConnected
                ? "You are connected to a live agent."
                : "Smart Delivery Support is available 24/7. Tap 'Talk to support agent' for a human specialist."
            )
          }
        >
          <Ionicons name="information-circle-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping || isConnectingAgent ? (
            <View style={styles.typingIndicatorContainer}>
              <View style={[styles.supportAvatar, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={agentConnected ? "headset" : "person-circle"} size={18} color={colors.primary} />
              </View>
              <View
                style={[
                  styles.bubble,
                  styles.supportBubble,
                  styles.typingBubble,
                  { borderRadius: radii.lg, backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.t("footnote", "medium"), styles.typingText, { color: colors.primary }]}>{typingLabel}</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={[styles.quickRepliesWrapper, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.quickRepliesContainer, { paddingHorizontal: spacing.gutter }]}>
          {QUICK_REPLIES.map((reply, index) => (
            <Pill key={index} label={reply.text} onPress={() => handleQuickReplyPress(reply)} />
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              typography.t("body", "regular"),
              styles.input,
              { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }, !inputText.trim() && styles.disabledSendBtn]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 5,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  onlineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  infoBtn: {
    padding: 5,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  userRow: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  supportRow: {
    alignSelf: "flex-start",
  },
  supportAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  supportBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  timeText: {
    marginTop: 5,
    alignSelf: "flex-end",
  },
  typingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: {
    marginLeft: 8,
  },
  quickRepliesWrapper: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickRepliesContainer: {
    paddingHorizontal: 15,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSendBtn: {
    opacity: 0.5,
  },
});
