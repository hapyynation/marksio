-- CreateEnum
CREATE TYPE "QualityRating" AS ENUM ('GREEN', 'YELLOW', 'RED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MessagingTier" AS ENUM ('TIER_250', 'TIER_1K', 'TIER_10K', 'TIER_100K', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "WhatsappAccountStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "WaTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "OptInStatus" AS ENUM ('OPTED_IN', 'OPTED_OUT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WaConversationStatus" AS ENUM ('AI_HANDLING', 'HUMAN_TAKEOVER', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WaMessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssistantTone" AS ENUM ('FORMAL', 'FRIENDLY', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "AssistantResponseLength" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateEnum
CREATE TYPE "AssistantConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "HandoverRuleType" AS ENUM ('AI_CANNOT_RESOLVE', 'ORDER_COMPLAINT', 'RETURN_REQUEST', 'ANGRY_CUSTOMER', 'MANUAL_TRANSFER');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('WEBSITE_URL', 'PDF', 'FAQ_IMPORT', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardingData" TEXT NOT NULL DEFAULT '{}',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lsSubscriptionId" TEXT,
    "lsCustomerId" TEXT,
    "lsOrderId" TEXT,
    "planStatus" TEXT NOT NULL DEFAULT 'active',
    "planRenewsAt" TIMESTAMP(3),
    "emailQuotaUsed" INTEGER NOT NULL DEFAULT 0,
    "whatsappQuotaUsed" INTEGER NOT NULL DEFAULT 0,
    "quotaResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "segment" TEXT NOT NULL,
    "subject" TEXT,
    "previewText" TEXT,
    "headline" TEXT,
    "body" TEXT NOT NULL,
    "design" TEXT NOT NULL DEFAULT '[]',
    "cta" TEXT,
    "tips" TEXT NOT NULL DEFAULT '[]',
    "purpose" TEXT,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "htmlContent" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "layoutStyle" TEXT,
    "brandColor" TEXT,
    "templateType" TEXT,
    "sentAt" TIMESTAMP(3),
    "sent" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "converted" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productsJson" TEXT NOT NULL DEFAULT '[]',
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRevenue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "orderTotal" DOUBLE PRECISION NOT NULL,
    "attributionType" TEXT NOT NULL DEFAULT 'last_click',
    "daysSinceClick" INTEGER,
    "touchCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "price" DOUBLE PRECISION,
    "compareAtPrice" DOUBLE PRECISION,
    "description" TEXT,
    "category" TEXT,
    "productUrl" TEXT,
    "platformId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "resendMessageId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignOpen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignOpen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "segment" TEXT NOT NULL DEFAULT 'new',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOrder" TIMESTAMP(3),
    "tags" TEXT NOT NULL DEFAULT '[]',
    "score" INTEGER NOT NULL DEFAULT 50,
    "platformId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "riskScore" TEXT NOT NULL DEFAULT 'low',
    "birthdayMonth" INTEGER,
    "birthdayDay" INTEGER,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribeToken" TEXT NOT NULL,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "bouncedAt" TIMESTAMP(3),
    "complained" BOOLEAN NOT NULL DEFAULT false,
    "complainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopDomain" TEXT,
    "accessToken" TEXT,
    "apiSecret" TEXT,
    "sellerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSyncAt" TIMESTAMP(3),
    "webhookId" TEXT,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT,
    "customerId" TEXT NOT NULL,
    "platformOrderId" TEXT,
    "orderNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "financialStatus" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "shippingCity" TEXT,
    "shippingCountry" TEXT,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "platformId" TEXT,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "productUrl" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'shopify',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "steps" TEXT NOT NULL DEFAULT '[]',
    "segment" TEXT,
    "triggerConfig" TEXT NOT NULL DEFAULT '{}',
    "flowData" TEXT NOT NULL DEFAULT '{}',
    "sent" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "converted" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "currentNodeId" TEXT,
    "context" TEXT NOT NULL DEFAULT '{}',
    "resumeAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRunStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "nodeLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT NOT NULL DEFAULT '{}',
    "output" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "rules" TEXT NOT NULL DEFAULT '[]',
    "matchType" TEXT NOT NULL DEFAULT 'all',
    "count" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT 'violet',
    "icon" TEXT NOT NULL DEFAULT 'Users',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "design" TEXT NOT NULL DEFAULT '[]',
    "cta" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customers" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "products" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDomain" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "resendId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dnsRecords" TEXT NOT NULL DEFAULT '[]',
    "fromEmail" TEXT,
    "fromPrefix" TEXT NOT NULL DEFAULT 'kampanya',
    "senderName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botName" TEXT NOT NULL DEFAULT 'Marksio Asistan',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Merhaba! Size nasıl yardımcı olabilirim?',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'Üzgünüm, bu konuda yardımcı olamıyorum. Ekibimiz en kısa sürede iletişime geçecek.',
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "responseLength" TEXT NOT NULL DEFAULT 'medium',
    "emojiUsage" TEXT NOT NULL DEFAULT 'low',
    "humanHandoffMessage" TEXT NOT NULL DEFAULT 'Sizi mağaza ekibimizle bağlıyorum.',
    "businessHoursMessage" TEXT NOT NULL DEFAULT 'Mesai saatlerimiz dışında yazıyorsunuz. En kısa sürede yanıt vereceğiz.',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "autoResponseEnabled" BOOLEAN NOT NULL DEFAULT true,
    "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "businessHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "businessHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "metaAccessToken" TEXT,
    "phoneNumberId" TEXT,
    "businessAccountId" TEXT,
    "webhookVerifyToken" TEXT,
    "appSecret" TEXT,
    "connectionStatus" TEXT NOT NULL DEFAULT 'disconnected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppQuickReply" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "triggerKeywords" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppQuickReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedBy" TEXT,
    "lastMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorSession" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ip" TEXT,
    "city" TEXT,
    "country" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "currentPage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "pageUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppCampaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audienceSegmentId" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "opened" INTEGER NOT NULL DEFAULT 0,
    "externalMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "subject" TEXT,
    "htmlContent" TEXT,
    "textContent" TEXT,
    "thumbnail" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailHealthScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complaintRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unsubscribeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'good',

    CONSTRAINT "EmailHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignId" TEXT,
    "variantA" JSONB NOT NULL,
    "variantB" JSONB NOT NULL,
    "splitPercent" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "winnerVariant" TEXT,
    "sentA" INTEGER NOT NULL DEFAULT 0,
    "sentB" INTEGER NOT NULL DEFAULT 0,
    "openedA" INTEGER NOT NULL DEFAULT 0,
    "openedB" INTEGER NOT NULL DEFAULT 0,
    "clickedA" INTEGER NOT NULL DEFAULT 0,
    "clickedB" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wabaId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "appSecret" TEXT NOT NULL,
    "displayName" TEXT,
    "verifiedName" TEXT,
    "qualityRating" "QualityRating" NOT NULL DEFAULT 'UNKNOWN',
    "messagingTier" "MessagingTier" NOT NULL DEFAULT 'TIER_250',
    "webhookVerifyToken" TEXT NOT NULL,
    "status" "WhatsappAccountStatus" NOT NULL DEFAULT 'PENDING',
    "lastWebhookAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappTemplate" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "metaTemplateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "language" TEXT NOT NULL,
    "status" "WaTemplateStatus" NOT NULL,
    "componentsJson" JSONB NOT NULL,
    "rejectedReason" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "optInStatus" "OptInStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastInboundAt" TIMESTAMP(3),
    "windowExpiresAt" TIMESTAMP(3),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappConversation" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "WaConversationStatus" NOT NULL DEFAULT 'AI_HANDLING',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiDecisionLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "knowledgeSource" TEXT,
    "faqMatched" TEXT,
    "orderDataUsed" BOOLEAN NOT NULL DEFAULT false,
    "transferred" BOOLEAN NOT NULL DEFAULT false,
    "transferReason" TEXT,
    "action" TEXT,
    "responsePreview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationTagLink" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationTagLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "templateId" TEXT,
    "content" TEXT,
    "metaMessageId" TEXT,
    "status" "WaMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "errorReason" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "broadcastId" TEXT,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappBroadcast" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "segmentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "sendType" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappBroadcastConversion" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappBroadcastConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappAssistantConfig" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "tone" "AssistantTone" NOT NULL DEFAULT 'PROFESSIONAL',
    "responseLength" "AssistantResponseLength" NOT NULL DEFAULT 'MEDIUM',
    "confidenceLevel" "AssistantConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "businessName" TEXT,
    "customKnowledge" TEXT,
    "fallbackMessage" TEXT,
    "websiteUrl" TEXT,
    "shopifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workingHoursStart" TEXT,
    "workingHoursEnd" TEXT,
    "offlineMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappAssistantConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappAssistantFaq" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappAssistantFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappHandoverRule" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "ruleType" "HandoverRuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WhatsappHandoverRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappKnowledgeSource" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT,
    "fileName" TEXT,
    "storageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappKnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CampaignRevenue_campaignId_createdAt_idx" ON "CampaignRevenue"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignRevenue_userId_createdAt_idx" ON "CampaignRevenue"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignRevenue_customerId_idx" ON "CampaignRevenue"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRevenue_orderId_campaignId_attributionType_key" ON "CampaignRevenue"("orderId", "campaignId", "attributionType");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_status_idx" ON "CampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_customerId_key" ON "CampaignRecipient"("campaignId", "customerId");

-- CreateIndex
CREATE INDEX "CampaignProduct_userId_idx" ON "CampaignProduct"("userId");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_type_idx" ON "EmailEvent"("campaignId", "type");

-- CreateIndex
CREATE INDEX "EmailEvent_customerId_idx" ON "EmailEvent"("customerId");

-- CreateIndex
CREATE INDEX "EmailEvent_resendMessageId_idx" ON "EmailEvent"("resendMessageId");

-- CreateIndex
CREATE INDEX "CampaignOpen_userId_openedAt_idx" ON "CampaignOpen"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "CampaignOpen_campaignId_idx" ON "CampaignOpen"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignOpen_customerId_idx" ON "CampaignOpen"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_email_key" ON "Customer"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_platform_key" ON "Integration"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Order_userId_platformOrderId_key" ON "Order"("userId", "platformOrderId");

-- CreateIndex
CREATE INDEX "CustomerEvent_userId_type_processedAt_idx" ON "CustomerEvent"("userId", "type", "processedAt");

-- CreateIndex
CREATE INDEX "CustomerEvent_customerId_type_idx" ON "CustomerEvent"("customerId", "type");

-- CreateIndex
CREATE INDEX "AutomationRun_automationId_status_idx" ON "AutomationRun"("automationId", "status");

-- CreateIndex
CREATE INDEX "AutomationRun_userId_status_idx" ON "AutomationRun"("userId", "status");

-- CreateIndex
CREATE INDEX "AutomationRun_customerId_idx" ON "AutomationRun"("customerId");

-- CreateIndex
CREATE INDEX "AutomationRun_resumeAt_idx" ON "AutomationRun"("resumeAt");

-- CreateIndex
CREATE INDEX "AutomationRunStep_runId_idx" ON "AutomationRunStep"("runId");

-- CreateIndex
CREATE INDEX "AutomationLog_runId_idx" ON "AutomationLog"("runId");

-- CreateIndex
CREATE INDEX "AutomationLog_automationId_createdAt_idx" ON "AutomationLog"("automationId", "createdAt");

-- CreateIndex
CREATE INDEX "AutomationLog_userId_createdAt_idx" ON "AutomationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncLog_userId_platform_startedAt_idx" ON "SyncLog"("userId", "platform", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_token_key" ON "EmailVerification"("token");

-- CreateIndex
CREATE INDEX "EmailVerification_token_idx" ON "EmailVerification"("token");

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDomain_userId_domain_key" ON "EmailDomain"("userId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSettings_userId_key" ON "WhatsAppSettings"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppQuickReply_userId_idx" ON "WhatsAppQuickReply"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppConversation_userId_status_idx" ON "WhatsAppConversation"("userId", "status");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_conversationId_idx" ON "WhatsAppMessage"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_externalId_idx" ON "WhatsAppMessage"("externalId");

-- CreateIndex
CREATE INDEX "VisitorSession_storeId_lastSeenAt_idx" ON "VisitorSession"("storeId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "VisitorSession_storeId_sessionId_key" ON "VisitorSession"("storeId", "sessionId");

-- CreateIndex
CREATE INDEX "VisitorEvent_storeId_createdAt_idx" ON "VisitorEvent"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "VisitorEvent_sessionId_idx" ON "VisitorEvent"("sessionId");

-- CreateIndex
CREATE INDEX "WhatsAppCampaign_userId_idx" ON "WhatsAppCampaign"("userId");

-- CreateIndex
CREATE INDEX "WhatsAppCampaign_externalMessageId_idx" ON "WhatsAppCampaign"("externalMessageId");

-- CreateIndex
CREATE INDEX "EmailTemplate_userId_type_idx" ON "EmailTemplate"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "EmailHealthScore_userId_key" ON "EmailHealthScore"("userId");

-- CreateIndex
CREATE INDEX "ABTest_userId_status_idx" ON "ABTest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappAccount_phoneNumberId_key" ON "WhatsappAccount"("phoneNumberId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappAccount_webhookVerifyToken_key" ON "WhatsappAccount"("webhookVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappTemplate_accountId_metaTemplateId_key" ON "WhatsappTemplate"("accountId", "metaTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappContact_userId_phoneNumber_key" ON "WhatsappContact"("userId", "phoneNumber");

-- CreateIndex
CREATE INDEX "AiDecisionLog_conversationId_idx" ON "AiDecisionLog"("conversationId");

-- CreateIndex
CREATE INDEX "AiDecisionLog_userId_createdAt_idx" ON "AiDecisionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNote_conversationId_idx" ON "InternalNote"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationTag_userId_idx" ON "ConversationTag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationTag_userId_name_key" ON "ConversationTag"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationTagLink_conversationId_tagId_key" ON "ConversationTagLink"("conversationId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMessage_metaMessageId_key" ON "WhatsappMessage"("metaMessageId");

-- CreateIndex
CREATE INDEX "WhatsappBroadcast_userId_createdAt_idx" ON "WhatsappBroadcast"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsappBroadcast_accountId_status_idx" ON "WhatsappBroadcast"("accountId", "status");

-- CreateIndex
CREATE INDEX "WhatsappBroadcastConversion_broadcastId_idx" ON "WhatsappBroadcastConversion"("broadcastId");

-- CreateIndex
CREATE INDEX "WhatsappBroadcastConversion_userId_createdAt_idx" ON "WhatsappBroadcastConversion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappAssistantConfig_accountId_key" ON "WhatsappAssistantConfig"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappHandoverRule_configId_ruleType_key" ON "WhatsappHandoverRule"("configId", "ruleType");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRevenue" ADD CONSTRAINT "CampaignRevenue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRevenue" ADD CONSTRAINT "CampaignRevenue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignOpen" ADD CONSTRAINT "CampaignOpen_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignOpen" ADD CONSTRAINT "CampaignOpen_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRunStep" ADD CONSTRAINT "AutomationRunStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDomain" ADD CONSTRAINT "EmailDomain_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppSettings" ADD CONSTRAINT "WhatsAppSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppQuickReply" ADD CONSTRAINT "WhatsAppQuickReply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorSession" ADD CONSTRAINT "VisitorSession_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitorEvent" ADD CONSTRAINT "VisitorEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitorSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppCampaign" ADD CONSTRAINT "WhatsAppCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailHealthScore" ADD CONSTRAINT "EmailHealthScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTest" ADD CONSTRAINT "ABTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAccount" ADD CONSTRAINT "WhatsappAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsappAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "WhatsappContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappConversation" ADD CONSTRAINT "WhatsappConversation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsappAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiDecisionLog" ADD CONSTRAINT "AiDecisionLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTagLink" ADD CONSTRAINT "ConversationTagLink_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTagLink" ADD CONSTRAINT "ConversationTagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ConversationTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsappTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "WhatsappBroadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappBroadcast" ADD CONSTRAINT "WhatsappBroadcast_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsappAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappBroadcast" ADD CONSTRAINT "WhatsappBroadcast_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsappTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappBroadcastConversion" ADD CONSTRAINT "WhatsappBroadcastConversion_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "WhatsappBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAssistantConfig" ADD CONSTRAINT "WhatsappAssistantConfig_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsappAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappAssistantFaq" ADD CONSTRAINT "WhatsappAssistantFaq_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsappAssistantConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappHandoverRule" ADD CONSTRAINT "WhatsappHandoverRule_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsappAssistantConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappKnowledgeSource" ADD CONSTRAINT "WhatsappKnowledgeSource_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsappAssistantConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

