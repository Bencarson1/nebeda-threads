import {
  detectBudget,
  detectColour,
  detectGender,
  detectOccasion,
  filterProducts,
  initialShoppingOptions,
  nextMeasurementStep,
  occasions,
  stylingAdviceFor,
} from './assistantBusinessRules'
import { matchChatbotQuestion, normalizeText } from './chatbotMatcher'

function dynamicSuggestions(profile = {}, topic = '') {
  if (!profile.shoppingFor) return initialShoppingOptions
  if (!profile.gender) return ['Male', 'Female', 'Show me unisex pieces']
  if (!profile.occasion) return occasions.slice(0, 6)
  if (!profile.budget) return ['Under \u00a3100', '\u00a3100-\u00a3200', '\u00a3200-\u00a3400', 'Luxury']
  if (topic === 'wedding') return ['Show Agbada', 'Show Couple Outfits', 'Book Bespoke', 'Wedding Accessories']
  if (topic === 'measurements') return ['Next measurement', "Men's Measurements", "Women's Measurements", 'Start a Bespoke Order']
  return ['Recommend products', 'Start a Bespoke Order', 'Delivery Information', 'Track my order']
}

function needsProducts(input, profile = {}) {
  const text = normalizeText(input)
  const explicitRecommendation =
    text.includes('recommend') ||
    text.includes('show') ||
    text.includes('browse') ||
    text.includes('under') ||
    text.includes('gbp') ||
    text.includes('100') ||
    text.includes('200') ||
    text.includes('400') ||
    text.includes('green') ||
    text.includes('emerald') ||
    text.includes('church') ||
    text.includes('wedding') ||
    text.includes('engagement')
  const hasEnoughProfile = Boolean(profile.gender && profile.occasion && profile.budget)
  return explicitRecommendation || hasEnoughProfile
}

function updateProfileFromInput(input, current = {}) {
  const text = normalizeText(input)
  const next = { ...current }
  const gender = detectGender(input)
  const occasion = detectOccasion(input)
  const budget = detectBudget(input)
  const colour = detectColour(input)

  if (['ready to wear', 'bespoke', 'wedding', 'couple outfit', 'wedding collection'].includes(text)) next.shoppingFor = input
  if (text.includes('browse men') || text.includes('men collection') || text.includes("men's")) {
    next.shoppingFor = "Men's Collection"
    next.gender = 'Male'
  }
  if (text.includes('browse women') || text.includes('women collection') || text.includes("women's")) {
    next.shoppingFor = "Women's Collection"
    next.gender = 'Female'
  }
  if (text.includes('help choosing') || text.includes('style advice') || text === 'general help' || (text.includes('need') && text.includes('outfit'))) next.shoppingFor = 'Guided Shopping'
  if (gender) next.gender = gender
  if (occasion) next.occasion = occasion
  if (budget) next.budget = budget
  if (colour) next.colour = colour
  if (text.includes('size guide') || text.includes('measure')) next.mode = 'measurements'
  if (text.includes('bespoke') || text.includes('tailoring') || text.includes('custom')) next.mode = 'bespoke'
  return next
}

function answerFromEditableKnowledge(answer, editableKnowledge = []) {
  if (!editableKnowledge?.length) return answer
  const bySection = new Map(editableKnowledge.map((item) => [item.section, item]))
  const sectionMap = {
    shipping: 'shipping',
    payment: 'payment',
    returns: 'returns',
    measurements: 'measurement-guide',
    contact: 'contact',
  }
  const section = sectionMap[answer.id]
  const record = section ? bySection.get(section) : null
  if (!record?.content) return answer
  return { ...answer, answer: record.content }
}

async function getAssistantReply({
  customer,
  editableKnowledge,
  getLatestOrder,
  input,
  products,
  profile,
}) {
  const cleanInput = input.trim()
  const normalized = normalizeText(cleanInput)
  let nextProfile = updateProfileFromInput(cleanInput, profile)
  const events = []

  if (normalized.includes('size guide') || normalized.includes('measurement help') || normalized.includes('watch measurement video')) {
    events.push({ eventType: 'measurement_help_started', topic: 'measurements' })
    return {
      events,
      message: {
        text: "Let's take your measurements together. Choose the guide that fits the garment, and I will walk you through one measurement at a time.",
        links: [{ label: 'Custom Order Form', to: '/custom-order' }],
        handoff: normalized.includes('watch measurement video'),
      },
      profile: { ...nextProfile, mode: 'measurements' },
      suggestions: ["Men's Measurements", "Women's Measurements", 'Watch Measurement Video'],
      topic: 'measurements',
    }
  }

  if (normalized.includes('next measurement') || normalized.includes('mens measurements') || normalized.includes("men's measurements") || normalized.includes('male measurements') || normalized.includes('womens measurements') || normalized.includes("women's measurements") || normalized.includes('female measurements')) {
    events.push({ eventType: 'measurement_help_started', topic: 'measurements' })
    if (normalized.includes('female') || normalized.includes('women')) nextProfile = { ...nextProfile, measurementGender: 'Female', measurementIndex: 0, mode: 'measurements' }
    if (normalized.includes('male') || normalized.includes('men')) nextProfile = { ...nextProfile, measurementGender: 'Male', measurementIndex: 0, mode: 'measurements' }
    const step = nextMeasurementStep(nextProfile)
    nextProfile = { ...nextProfile, measurementIndex: step.nextIndex, mode: 'measurements' }
    return {
      events,
      message: {
        text: step.instruction,
        links: [{ label: 'Open Custom Order Form', to: '/custom-order' }],
      },
      profile: nextProfile,
      suggestions: ['Next measurement', 'Start a Bespoke Order', 'Speak on WhatsApp'],
      topic: 'measurements',
    }
  }

  if (normalized.includes('speak on whatsapp') || normalized.includes('whatsapp stylist')) {
    return {
      events: [{ eventType: 'whatsapp_escalation', topic: 'support' }],
      message: {
        text: "I'd love to help further. This question needs one of our fashion specialists, and you can continue instantly on WhatsApp.",
        handoff: true,
      },
      profile: nextProfile,
      suggestions: ["Browse Men's Collection", "Browse Women's Collection", 'Start a Bespoke Order'],
      topic: 'contact',
    }
  }

  if (normalized.includes('delivery information')) {
    const answer = answerFromEditableKnowledge(matchChatbotQuestion('delivery shipping'), editableKnowledge)
    return {
      events,
      message: { text: answer.answer, links: answer.links, handoff: answer.handoff },
      profile: nextProfile,
      suggestions: ['UK delivery', 'Nigeria shipping', 'Speak on WhatsApp'],
      topic: 'shipping',
    }
  }

  if (normalized.includes('track my order') || normalized.includes('track') || normalized.includes('order status') || normalized.includes('check my order')) {
    events.push({ eventType: 'order_tracking_requested', topic: 'tracking' })
    if (!customer) {
      return {
        events,
        message: {
          text: 'Sign in to view your private order status. Once you are logged in, My Orders will show payment, fulfilment, and tracking information when available.',
          links: [{ label: 'Login', to: '/login?redirect=/account/orders' }, { label: 'My Orders', to: '/account/orders' }],
        },
        profile: nextProfile,
        suggestions: ['Login', 'Delivery Information', 'Speak on WhatsApp'],
        topic: 'tracking',
      }
    }

    try {
      const latestOrder = await getLatestOrder()
      if (latestOrder) {
        const tracking = latestOrder.trackingNumber ? `\n\nTracking: ${latestOrder.trackingCarrier || 'Carrier'} ${latestOrder.trackingNumber}` : ''
        return {
          events,
          message: {
            text: `Your latest order is currently ${latestOrder.orderStatus || 'being reviewed'} with payment marked ${latestOrder.paymentStatus || 'Pending'}.${tracking}`,
            links: [{ label: 'Open My Orders', to: '/account/orders' }],
          },
          profile: nextProfile,
          suggestions: ['Delivery Information', 'Custom Orders', 'Speak on WhatsApp'],
          topic: 'tracking',
        }
      }
    } catch {
      // Fall through to the safe account link below.
    }

    return {
      events,
      message: {
        text: 'I could not load your latest order in this moment. Please open My Orders, or message Nebeda Threads on WhatsApp if you need urgent support.',
        links: [{ label: 'Open My Orders', to: '/account/orders' }],
        handoff: true,
      },
      profile: nextProfile,
      suggestions: ['Delivery Information', 'Speak on WhatsApp'],
      topic: 'tracking',
    }
  }

  const styleAdvice = stylingAdviceFor(cleanInput, nextProfile)
  if (styleAdvice) {
    events.push({ eventType: 'style_advice_started', topic: nextProfile.occasion || detectOccasion(cleanInput) || 'style-advice' })
    nextProfile = { ...nextProfile, occasion: nextProfile.occasion || detectOccasion(cleanInput) || 'Wedding' }
  }

  if (normalized.includes('bespoke tailoring') || normalized.includes('start a bespoke order') || normalized.includes('bespoke') || normalized.includes('custom order') || normalized.includes('book bespoke')) {
    events.push({ eventType: 'bespoke_started', topic: 'bespoke' })
    return {
      events,
      message: {
        text: 'That is a thoughtful route for a personal piece. I can help you shape the brief: occasion, garment type, colour, fabric, deadline, budget, measurements, and reference images. When you are ready, the custom order form sends everything securely to Nebeda Threads for quotation.',
        links: [{ label: 'Start Custom Order', to: '/custom-order' }],
      },
      profile: { ...nextProfile, mode: 'bespoke' },
      suggestions: ['Wedding Outfit', 'Agbada', 'Bubu', 'Size Guide'],
      topic: 'bespoke',
    }
  }

  if (needsProducts(cleanInput, nextProfile) && products?.length) {
    const recommendations = filterProducts(products, nextProfile)
    if (recommendations.length) {
      events.push(...recommendations.map((product) => ({
        eventType: 'product_recommended',
        productId: product.id,
        productName: product.name,
        topic: nextProfile.occasion || nextProfile.shoppingFor || 'recommendation',
      })))
      return {
        events,
        message: {
          text: [styleAdvice, 'Based on what you have shared, these existing Nebeda Threads pieces are the closest fit.'].filter(Boolean).join('\n\n'),
          products: recommendations,
          links: [{ label: 'Shop Collection', to: '/shop' }],
        },
        profile: nextProfile,
        suggestions: dynamicSuggestions(nextProfile, normalizeText(nextProfile.occasion)),
        topic: 'recommendation',
      }
    }

    return {
      events: [...events, { eventType: 'no_answer', topic: 'recommendation', questionText: cleanInput }],
      message: {
        text: [styleAdvice, 'I do not want to invent products that are not available. A bespoke request may be the better route for this exact style, colour, or deadline.'].filter(Boolean).join('\n\n'),
        links: [{ label: 'Start Custom Order', to: '/custom-order' }],
        handoff: true,
      },
      profile: nextProfile,
      suggestions: ['Start a Bespoke Order', 'Browse Men\'s Collection', 'Speak on WhatsApp'],
      topic: 'recommendation',
    }
  }

  if (!nextProfile.shoppingFor) {
    return {
      events,
      message: {
        text: "\u{1F44B} Welcome to Nebeda Threads.\n\nI'm your Personal Fashion Assistant.\n\nI can help you:\n\u2728 Find the perfect outfit\n\u2728 Recommend styles for your event\n\u2728 Guide your measurements\n\u2728 Start a bespoke order\n\u2728 Answer delivery and payment questions\n\nWhat are you shopping for today?",
      },
      profile: nextProfile,
      suggestions: initialShoppingOptions,
      topic: 'welcome',
    }
  }

  if (!nextProfile.gender) {
    return {
      events,
      message: { text: 'Great choice. Who is the outfit for?' },
      profile: nextProfile,
      suggestions: ['Male', 'Female', 'Show me unisex pieces'],
      topic: 'gender',
    }
  }

  if (!nextProfile.occasion) {
    return {
      events,
      message: { text: 'Lovely. What occasion are you dressing for?' },
      profile: nextProfile,
      suggestions: occasions.slice(0, 6),
      topic: 'occasion',
    }
  }

  if (!nextProfile.budget) {
    return {
      events,
      message: { text: 'Many customers find it easier when we narrow the budget first. Which range feels right?' },
      profile: nextProfile,
      suggestions: ['Under \u00a3100', '\u00a3100-\u00a3200', '\u00a3200-\u00a3400', 'Luxury'],
      topic: 'budget',
    }
  }

  const faqAnswer = answerFromEditableKnowledge(matchChatbotQuestion(cleanInput), editableKnowledge)
  const isUnknown = faqAnswer.id === 'unknown'
  if (isUnknown) {
    events.push({ eventType: 'no_answer', topic: 'unknown', questionText: cleanInput })
  }

  return {
    events,
    message: {
      text: isUnknown
        ? "I'd love to help further. This question needs one of our fashion specialists, and you can continue instantly on WhatsApp."
        : faqAnswer.answer,
      links: faqAnswer.links,
      handoff: faqAnswer.handoff || isUnknown,
    },
    profile: nextProfile,
    suggestions: dynamicSuggestions(nextProfile, faqAnswer.id),
    topic: faqAnswer.id,
  }
}

export { dynamicSuggestions, getAssistantReply }
