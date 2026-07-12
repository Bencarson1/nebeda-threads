import { normalizeText } from './chatbotMatcher'

const initialShoppingOptions = [
  'Ready to Wear',
  'Bespoke',
  'Wedding',
  'Couple Outfit',
  "Men's Collection",
  "Women's Collection",
  'I need help choosing',
]

const occasions = [
  'Wedding',
  'Birthday',
  'Church',
  'Engagement',
  'Traditional Wedding',
  'Graduation',
  'Casual',
  'Photoshoot',
  'Corporate',
  'Other',
]

const budgets = ['Under £100', '£100-£200', '£200-£400', 'Luxury']

const measurementFlows = {
  female: [
    ['Shoulder', 'Measure from shoulder point to shoulder point.'],
    ['Bust', 'Measure around the fullest part of the bust.'],
    ['Round Under Bust', 'Measure firmly around the ribcage below the bust.'],
    ['Shoulder to Bust Point', 'Measure from shoulder top to bust point.'],
    ['Shoulder to Under Bust', 'Measure from shoulder top to under bust line.'],
    ['Nipple to Nipple', 'Measure from bust point to bust point.'],
    ['Waist', 'Measure around the natural waist.'],
    ['Half Length', 'Measure from shoulder to waist.'],
    ['Hip', 'Measure around the fullest part of the hip.'],
    ['Sleeve Length', 'Measure from shoulder point to desired sleeve end.'],
    ['Round Arm', 'Measure around the upper arm.'],
    ['Full Length', 'Measure from shoulder to desired garment length.'],
    ['From Belly Button to Down', 'Measure from belly button to desired lower length.'],
  ],
  male: [
    ['Shoulder', 'Measure from shoulder point to shoulder point.'],
    ['Chest', 'Measure around the fullest part of the chest.'],
    ['Waist', 'Measure around the natural waist.'],
    ['Hip', 'Measure around the fullest part of the hip.'],
    ['Neck', 'Measure comfortably around the neck.'],
    ['Sleeve Length', 'Measure from shoulder point to wrist.'],
    ['Round Arm', 'Measure around the upper arm.'],
    ['Wrist', 'Measure around the wrist.'],
    ['Top Length', 'Measure from shoulder to desired top length.'],
    ['Trouser Waist', 'Measure around where trousers will sit.'],
    ['Thigh', 'Measure around the fullest part of the thigh.'],
    ['Knee', 'Measure around the knee.'],
    ['Calf', 'Measure around the calf.'],
    ['Ankle', 'Measure around the ankle.'],
    ['Trouser Length', 'Measure from trouser waist to ankle or desired hem.'],
  ],
}

const colourWords = ['black', 'white', 'gold', 'green', 'blue', 'red', 'cream', 'brown', 'purple', 'pink', 'silver']

function getProductPrice(product) {
  const value = Number(product?.priceAmount ?? product?.numericPrice)
  if (Number.isFinite(value) && value > 0) return value
  const parsed = String(product?.price || '').match(/\d+(?:\.\d+)?/)
  return parsed ? Number(parsed[0]) : null
}

function productImage(product) {
  return product?.mainImage?.url || product?.images?.[0]?.url || ''
}

function productHref(product) {
  return product?.slug ? `/shop/${product.slug}` : '/shop'
}

function detectBudget(input) {
  const text = normalizeText(input)
  if (text.includes('under 100') || text.includes('less than 100') || text.includes('under £100')) return 'Under £100'
  if (text.includes('100') && text.includes('200')) return '£100-£200'
  if (text.includes('200') && text.includes('400')) return '£200-£400'
  if (text.includes('luxury') || text.includes('premium')) return 'Luxury'
  return budgets.find((budget) => normalizeText(budget) === text) || ''
}

function budgetRange(label) {
  if (label === 'Under £100') return [0, 100]
  if (label === '£100-£200') return [100, 200]
  if (label === '£200-£400') return [200, 400]
  if (label === 'Luxury') return [400, Infinity]
  return [0, Infinity]
}

function detectColour(input) {
  const text = normalizeText(input)
  return colourWords.find((colour) => text.split(' ').includes(colour)) || ''
}

function detectOccasion(input) {
  const text = normalizeText(input)
  return occasions.find((occasion) => text.includes(normalizeText(occasion))) || ''
}

function detectGender(input) {
  const text = normalizeText(input)
  if (text.includes('male') || text.includes('men') || text.includes("men's")) return 'Male'
  if (text.includes('female') || text.includes('women') || text.includes("women's")) return 'Female'
  return ''
}

function filterProducts(products = [], profile = {}) {
  const [min, max] = budgetRange(profile.budget)
  const gender = normalizeText(profile.gender)
  const colour = normalizeText(profile.colour)
  const occasion = normalizeText(profile.occasion)
  const shoppingFor = normalizeText(profile.shoppingFor)

  return products
    .filter((product) => product?.isActive !== false && !product?.isQuoteOnly)
    .map((product) => ({ product, price: getProductPrice(product) }))
    .filter(({ price }) => price !== null && price >= min && price <= max)
    .filter(({ product }) => {
      const searchText = normalizeText([
        product.name,
        product.shortDescription,
        product.displayCategory,
        product.gender,
        product.badge,
        ...(product.categories || []),
        ...(product.colors || product.colours || []),
      ].join(' '))
      if (gender && !searchText.includes(gender.toLowerCase()) && !searchText.includes('unisex')) return false
      if (colour && !searchText.includes(colour)) return false
      if (occasion && !searchText.includes(occasion) && occasion !== 'church' && occasion !== 'casual') {
        return false
      }
      if (shoppingFor.includes('wedding') && !searchText.includes('wedding') && !searchText.includes('bespoke')) return false
      return true
    })
    .slice(0, 3)
    .map(({ product, price }) => ({
      id: product._id,
      name: product.name,
      price: product.displayPrice || product.price || (price ? `£${price}` : ''),
      image: productImage(product),
      href: productHref(product),
      description: product.shortDescription || product.displayCategory || '',
    }))
}

function stylingAdviceFor(input, profile = {}) {
  const text = normalizeText(input)
  const occasion = profile.occasion || detectOccasion(input)

  if (text.includes('nigerian wedding') || normalizeText(occasion).includes('wedding')) {
    return "That's a beautiful occasion. For a Nigerian wedding, Nebeda Threads would usually guide you toward refined agbada, aso oke, kaftan, bubu, or a coordinated couple look. Rich jewel tones, gold accents, lace, aso oke, and structured tailoring work especially well because they feel celebratory without losing elegance."
  }

  if (text.includes('church')) {
    return 'For church, choose something graceful and comfortable: a polished kaftan, bubu, senator style, or modest Ankara dress. Cream, green, navy, gold, and soft neutrals usually feel elegant while still being easy to wear.'
  }

  if (text.includes('photoshoot')) {
    return 'For a photoshoot, go for strong shape and colour: aso oke textures, flowing bubu silhouettes, statement sleeves, or coordinated couple styling. Choose a colour that contrasts cleanly with your backdrop.'
  }

  return ''
}

function nextMeasurementStep(profile = {}) {
  const genderKey = normalizeText(profile.measurementGender || profile.gender || '').includes('female') ? 'female' : 'male'
  const steps = measurementFlows[genderKey]
  const index = Math.min(profile.measurementIndex || 0, steps.length - 1)
  const [label, instruction] = steps[index]
  return {
    done: index >= steps.length - 1,
    genderKey,
    instruction: `Let's take your ${label} measurement first.\n\n${instruction}\n\nUse cm or inches consistently, and write it down before moving to the next point.`,
    label,
    nextIndex: Math.min(index + 1, steps.length - 1),
  }
}

function buildProductEventProducts(products) {
  return products.map((product) => ({
    productId: product.id,
    productName: product.name,
  }))
}

export {
  budgets,
  buildProductEventProducts,
  detectBudget,
  detectColour,
  detectGender,
  detectOccasion,
  filterProducts,
  initialShoppingOptions,
  nextMeasurementStep,
  occasions,
  stylingAdviceFor,
}
