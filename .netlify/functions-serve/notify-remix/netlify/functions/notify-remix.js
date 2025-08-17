"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/notify-remix.ts
var notify_remix_exports = {};
__export(notify_remix_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(notify_remix_exports);

// netlify/lib/neonAdmin.ts
var neonAdmin = {
  from: (table) => {
    console.warn(`neonAdmin.from('${table}') is deprecated. Use Neon sql directly instead.`);
    return {
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) })
    };
  }
};

// netlify/functions/notify-remix.ts
var handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }
    const { parentId, childId, createdAt } = JSON.parse(event.body || "{}");
    if (!parentId || !childId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "parentId and childId are required" })
      };
    }
    const { data: parentMedia, error: parentError } = await neonAdmin.from("media_assets").select("user_id, remix_count").eq("id", parentId).single();
    if (parentError || !parentMedia) {
      console.error("Failed to find parent media:", parentError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Parent media not found" })
      };
    }
    const { error: updateError } = await neonAdmin.from("media_assets").update({ remix_count: (parentMedia.remix_count || 0) + 1 }).eq("id", parentId);
    if (updateError) {
      console.warn("Failed to update remix count:", updateError);
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { data: existingNotifications } = await neonAdmin.from("notifications").select("id, metadata").eq("user_id", parentMedia.user_id).eq("kind", "remix").gte("created_at", `${today}T00:00:00.000Z`).lt("created_at", `${today}T23:59:59.999Z`);
    if (existingNotifications && existingNotifications.length > 0) {
      const existingNotification = existingNotifications[0];
      const currentCount = existingNotification.metadata?.count || 1;
      const { error: updateNotificationError } = await neonAdmin.from("notifications").update({
        metadata: {
          ...existingNotification.metadata,
          count: currentCount + 1,
          latest_child_id: childId
        },
        created_at: createdAt
        // Update timestamp to latest remix
      }).eq("id", existingNotification.id);
      if (updateNotificationError) {
        console.error("Failed to update notification:", updateNotificationError);
      } else {
        console.log(`Updated remix notification count to ${currentCount + 1} for user ${parentMedia.user_id}`);
      }
    } else {
      const notification = {
        user_id: parentMedia.user_id,
        kind: "remix",
        media_id: childId,
        // Point to the new remix
        created_at: createdAt,
        read: false,
        metadata: {
          child_id: childId,
          count: 1
        }
      };
      const { error: insertError } = await neonAdmin.from("notifications").insert([notification]);
      if (insertError) {
        console.error("Failed to create notification:", insertError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to create notification" })
        };
      }
      console.log(`Created remix notification for user ${parentMedia.user_id}`);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Remix notification sent",
        parentUserId: parentMedia.user_id
      })
    };
  } catch (error) {
    console.error("Remix notification error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=notify-remix.js.map
