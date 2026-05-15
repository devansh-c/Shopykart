
export const mockStores = [
  {
    id: 's1',
    storeName: 'Rajaram Sweets & Snacks',
    category: 'Snacks • Sweets',
    rating: 4.8,
    deliveryTime: '20 min',
    address: 'Main Market, Ranipur',
    town: 'Ranipur',
    description: 'Home of the legendary Special Patize and Bhel Puri.',
    imageUrl: 'https://picsum.photos/seed/rajaram/600/400'
  },
  {
    id: 's2',
    storeName: 'ShopyKart Signature',
    category: 'Gourmet • Continental',
    rating: 4.9,
    deliveryTime: '25 min',
    address: 'Elite Hub, Ranipur',
    town: 'Ranipur',
    description: 'Our in-house premium selection of fine dining delicacies.',
    imageUrl: 'https://picsum.photos/seed/shopy-store/600/400'
  },
  {
    id: 's3',
    storeName: 'Burger Point',
    category: 'Fast Food • Burgers',
    rating: 4.5,
    deliveryTime: '15 min',
    address: 'Cinema Road, Ranipur',
    town: 'Ranipur',
    description: 'Juicy burgers and crispy fries.',
    imageUrl: 'https://picsum.photos/seed/burger-point/600/400'
  },
  {
    id: 's4',
    storeName: 'Pizza Heaven',
    category: 'Italian • Pizza',
    rating: 4.7,
    deliveryTime: '30 min',
    address: 'Station Road, Ranipur',
    town: 'Ranipur',
    description: 'Authentic wood-fired pizzas.',
    imageUrl: 'https://picsum.photos/seed/pizza-heaven/600/400'
  },
  {
    id: 's5',
    storeName: 'Chaat Corner',
    category: 'Street Food • Indian',
    rating: 4.4,
    deliveryTime: '10 min',
    address: 'Subhash Chowk, Ranipur',
    town: 'Ranipur',
    description: 'Spicy and tangy local street food.',
    imageUrl: 'https://picsum.photos/seed/chaat-corner/600/400'
  },
  {
    id: 's6',
    storeName: 'Royal Dine',
    category: 'North Indian • Mughlai',
    rating: 4.6,
    deliveryTime: '35 min',
    address: 'Main Chowk, Mauranipur',
    town: 'Mauranipur',
    description: 'Rich flavors of traditional Mughlai cuisine.',
    imageUrl: 'https://picsum.photos/seed/royal-dine/600/400'
  },
  {
    id: 's7',
    storeName: 'Tandoori Nights',
    category: 'Grill • North Indian',
    rating: 4.3,
    deliveryTime: '25 min',
    address: 'Nagar Palika, Mauranipur',
    town: 'Mauranipur',
    description: 'Best kebabs and tikkas in town.',
    imageUrl: 'https://picsum.photos/seed/tandoori-nights/600/400'
  },
  {
    id: 's8',
    storeName: 'Fresh Bites',
    category: 'Healthy • Salads',
    rating: 4.2,
    deliveryTime: '20 min',
    address: 'Civil Lines, Mauranipur',
    town: 'Mauranipur',
    description: 'Healthy and organic meal options.',
    imageUrl: 'https://picsum.photos/seed/fresh-bites/600/400'
  },
  {
    id: 's9',
    storeName: 'South Indian Hub',
    category: 'South Indian',
    rating: 4.5,
    deliveryTime: '15 min',
    address: 'Bus Stand, Mauranipur',
    town: 'Mauranipur',
    description: 'Crispy dosas and soft idlis.',
    imageUrl: 'https://picsum.photos/seed/south-indian/600/400'
  },
  {
    id: 's10',
    storeName: 'Dessert World',
    category: 'Bakery • Desserts',
    rating: 4.8,
    deliveryTime: '20 min',
    address: 'Jhansi Road, Mauranipur',
    town: 'Mauranipur',
    description: 'Sweet treats and birthday cakes.',
    imageUrl: 'https://picsum.photos/seed/dessert-world/600/400'
  }
];

export const allProducts = [
  // Store 1: Rajaram Sweets (Ranipur)
  { id: 'p1', vendorId: 's1', restaurantName: 'Rajaram Sweets & Snacks', name: 'Rajaram Special Patize', price: 79, description: 'Flaky layers with spicy potato filling.', category: 'snacks', isVeg: true, town: 'Ranipur', badges: ['Bestseller'] },
  { id: 'p2', vendorId: 's1', restaurantName: 'Rajaram Sweets & Snacks', name: 'Special Bhel Puri', price: 69, description: 'Crunchy puffed rice with tangy chutneys.', category: 'snacks', isVeg: true, town: 'Ranipur', badges: ['Trending'] },
  { id: 'p3', vendorId: 's1', restaurantName: 'Rajaram Sweets & Snacks', name: 'Gulab Jamun (2pcs)', price: 40, description: 'Soft milk-based sweets in syrup.', category: 'drinks', isVeg: true, town: 'Ranipur' },
  { id: 'p4', vendorId: 's1', restaurantName: 'Rajaram Sweets & Snacks', name: 'Kachori Sabzi', price: 50, description: 'Crispy kachoris served with spicy aloo.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p5', vendorId: 's1', restaurantName: 'Rajaram Sweets & Snacks', name: 'Samosa (Plate)', price: 30, description: 'Traditional potato samosas with chutney.', category: 'snacks', isVeg: true, town: 'Ranipur' },

  // Store 2: ShopyKart Signature (Ranipur)
  { id: 'p6', vendorId: 's2', restaurantName: 'ShopyKart Signature', name: 'Peri-Peri Loaded Fries', price: 129, description: 'Crispy fries with peri-peri and cheese.', category: 'fries', isVeg: true, town: 'Ranipur', badges: ['Bestseller'] },
  { id: 'p7', vendorId: 's2', restaurantName: 'ShopyKart Signature', name: 'Signature Veggie Burger', price: 189, description: 'Double patty burger with dynamite sauce.', category: 'burgers', isVeg: true, town: 'Ranipur', badges: ['Featured'] },
  { id: 'p8', vendorId: 's2', restaurantName: 'ShopyKart Signature', name: 'Creamy Pesto Pasta', price: 249, description: 'Penne in rich basil pesto sauce.', category: 'pasta', isVeg: true, town: 'Ranipur' },
  { id: 'p9', vendorId: 's2', restaurantName: 'ShopyKart Signature', name: 'Truffle Mushroom Pizza', price: 399, description: 'Thin crust with mushrooms and truffle oil.', category: 'pizza', isVeg: true, town: 'Ranipur' },
  { id: 'p10', vendorId: 's2', restaurantName: 'ShopyKart Signature', name: 'Virgin Mojito', price: 99, description: 'Refreshing lime and mint cooler.', category: 'drinks', isVeg: true, town: 'Ranipur' },

  // Store 3: Burger Point (Ranipur)
  { id: 'p11', vendorId: 's3', restaurantName: 'Burger Point', name: 'Cheese Blast Burger', price: 149, description: 'Oozing with melted cheddar cheese.', category: 'burgers', isVeg: true, town: 'Ranipur' },
  { id: 'p12', vendorId: 's3', restaurantName: 'Burger Point', name: 'Paneer Tikka Burger', price: 169, description: 'Spicy grilled paneer patty.', category: 'burgers', isVeg: true, town: 'Ranipur' },
  { id: 'p13', vendorId: 's3', restaurantName: 'Burger Point', name: 'Masala Fries', price: 89, description: 'Spicy Indian style potato fries.', category: 'fries', isVeg: true, town: 'Ranipur' },
  { id: 'p14', vendorId: 's3', restaurantName: 'Burger Point', name: 'Chocolate Shake', price: 120, description: 'Thick and creamy Belgian chocolate.', category: 'drinks', isVeg: true, town: 'Ranipur' },
  { id: 'p15', vendorId: 's3', restaurantName: 'Burger Point', name: 'Veg Nuggets', price: 110, description: 'Crispy fried vegetable nuggets.', category: 'snacks', isVeg: true, town: 'Ranipur' },

  // Store 4: Pizza Heaven (Ranipur)
  { id: 'p16', vendorId: 's4', restaurantName: 'Pizza Heaven', name: 'Margherita Pizza', price: 299, description: 'Classic cheese and tomato pizza.', category: 'pizza', isVeg: true, town: 'Ranipur' },
  { id: 'p17', vendorId: 's4', restaurantName: 'Pizza Heaven', name: 'Farmhouse Pizza', price: 349, description: 'Loaded with capsicum, onion, and corn.', category: 'pizza', isVeg: true, town: 'Ranipur' },
  { id: 'p18', vendorId: 's4', restaurantName: 'Pizza Heaven', name: 'Garlic Breadsticks', price: 129, description: 'Soft bread with garlic and butter.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p19', vendorId: 's4', restaurantName: 'Pizza Heaven', name: 'Stuffed Garlic Bread', price: 159, description: 'Filled with cheese and jalapeños.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p20', vendorId: 's4', restaurantName: 'Pizza Heaven', name: 'Cold Coffee', price: 110, description: 'Iced coffee with vanilla scoop.', category: 'drinks', isVeg: true, town: 'Ranipur' },

  // Store 5: Chaat Corner (Ranipur)
  { id: 'p21', vendorId: 's5', restaurantName: 'Chaat Corner', name: 'Aloo Tikki Chaat', price: 60, description: 'Crispy patties topped with curd and chutney.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p22', vendorId: 's5', restaurantName: 'Chaat Corner', name: 'Pani Puri (8pcs)', price: 40, description: 'Spicy and tangy water balls.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p23', vendorId: 's5', restaurantName: 'Chaat Corner', name: 'Papdi Chaat', price: 55, description: 'Crunchy papdis with yogurt and sev.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p24', vendorId: 's5', restaurantName: 'Chaat Corner', name: 'Dahi Vada', price: 65, description: 'Soft lentil dumplings in sweet yogurt.', category: 'snacks', isVeg: true, town: 'Ranipur' },
  { id: 'p25', vendorId: 's5', restaurantName: 'Chaat Corner', name: 'Sweet Lassi', price: 50, description: 'Refreshing thick sweet yogurt drink.', category: 'drinks', isVeg: true, town: 'Ranipur' },

  // Store 6: Royal Dine (Mauranipur)
  { id: 'p26', vendorId: 's6', restaurantName: 'Royal Dine', name: 'Paneer Butter Masala', price: 240, description: 'Cottage cheese in rich tomato gravy.', category: 'pasta', isVeg: true, town: 'Mauranipur', badges: ['Bestseller'] },
  { id: 'p27', vendorId: 's6', restaurantName: 'Royal Dine', name: 'Veg Biryani', price: 220, description: 'Fragrant basmati rice with veggies.', category: 'pasta', isVeg: true, town: 'Mauranipur' },
  { id: 'p28', vendorId: 's6', restaurantName: 'Royal Dine', name: 'Butter Naan', price: 40, description: 'Soft tandoori bread with butter.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p29', vendorId: 's6', restaurantName: 'Royal Dine', name: 'Dal Makhani', price: 190, description: 'Black lentils cooked overnight.', category: 'pasta', isVeg: true, town: 'Mauranipur' },
  { id: 'p30', vendorId: 's6', restaurantName: 'Royal Dine', name: 'Jeera Rice', price: 150, description: 'Cumin flavored basmati rice.', category: 'pasta', isVeg: true, town: 'Mauranipur' },

  // Store 7: Tandoori Nights (Mauranipur)
  { id: 'p31', vendorId: 's7', restaurantName: 'Tandoori Nights', name: 'Paneer Tikka Platter', price: 280, description: 'Grilled cottage cheese with bell peppers.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p32', vendorId: 's7', restaurantName: 'Tandoori Nights', name: 'Soya Chaap Tikka', price: 210, description: 'Marinated soya chunks grilled in tandoor.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p33', vendorId: 's7', restaurantName: 'Tandoori Nights', name: 'Assorted Kebab Box', price: 450, description: 'Mix of best vegetarian kebabs.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p34', vendorId: 's7', restaurantName: 'Tandoori Nights', name: 'Rumali Roti', price: 25, description: 'Paper thin traditional bread.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p35', vendorId: 's7', restaurantName: 'Tandoori Nights', name: 'Pineapple Raita', price: 90, description: 'Sweet and savory yogurt with pineapple.', category: 'drinks', isVeg: true, town: 'Mauranipur' },

  // Store 8: Fresh Bites (Mauranipur)
  { id: 'p36', vendorId: 's8', restaurantName: 'Fresh Bites', name: 'Quinoa Salad', price: 180, description: 'Healthy quinoa with fresh veggies.', category: 'pasta', isVeg: true, town: 'Mauranipur' },
  { id: 'p37', vendorId: 's8', restaurantName: 'Fresh Bites', name: 'Greek Salad', price: 160, description: 'Feta cheese, olives, and greens.', category: 'pasta', isVeg: true, town: 'Mauranipur' },
  { id: 'p38', vendorId: 's8', restaurantName: 'Fresh Bites', name: 'Fresh Fruit Juice', price: 80, description: 'Seasonal mixed fruit juice.', category: 'drinks', isVeg: true, town: 'Mauranipur' },
  { id: 'p39', vendorId: 's8', restaurantName: 'Fresh Bites', name: 'Green Smoothie', price: 120, description: 'Spinach, kale, and apple blend.', category: 'drinks', isVeg: true, town: 'Mauranipur' },
  { id: 'p40', vendorId: 's8', restaurantName: 'Fresh Bites', name: 'Paneer Wrap', price: 140, description: 'Whole wheat wrap with grilled paneer.', category: 'snacks', isVeg: true, town: 'Mauranipur' },

  // Store 9: South Indian Hub (Mauranipur)
  { id: 'p41', vendorId: 's9', restaurantName: 'South Indian Hub', name: 'Masala Dosa', price: 120, description: 'Crispy crepe with potato filling.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p42', vendorId: 's9', restaurantName: 'South Indian Hub', name: 'Idli Sambar (2pcs)', price: 70, description: 'Steamed rice cakes with lentil soup.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p43', vendorId: 's9', restaurantName: 'South Indian Hub', name: 'Vada Sambar (2pcs)', price: 80, description: 'Savory fried lentil donuts.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p44', vendorId: 's9', restaurantName: 'South Indian Hub', name: 'Uttapam', price: 110, description: 'Thick pancake with onion and tomato.', category: 'snacks', isVeg: true, town: 'Mauranipur' },
  { id: 'p45', vendorId: 's9', restaurantName: 'South Indian Hub', name: 'Filter Coffee', price: 40, description: 'Traditional South Indian frothy coffee.', category: 'drinks', isVeg: true, town: 'Mauranipur' },

  // Store 10: Dessert World (Mauranipur)
  { id: 'p46', vendorId: 's10', restaurantName: 'Dessert World', name: 'Red Velvet Pastry', price: 90, description: 'Rich red velvet cake slice.', category: 'drinks', isVeg: true, town: 'Mauranipur', badges: ['Trending'] },
  { id: 'p47', vendorId: 's10', restaurantName: 'Dessert World', name: 'Chocolate Truffle Cake', price: 450, description: 'Half kg rich chocolate cake.', category: 'drinks', isVeg: true, town: 'Mauranipur' },
  { id: 'p48', vendorId: 's10', restaurantName: 'Dessert World', name: 'Vanilla Cupcake', price: 50, description: 'Small vanilla cake with frosting.', category: 'drinks', isVeg: true, town: 'Mauranipur' },
  { id: 'p49', vendorId: 's10', restaurantName: 'Dessert World', name: 'Fruit Custard', price: 85, description: 'Mixed fruits in vanilla custard.', category: 'drinks', isVeg: true, town: 'Mauranipur' },
  { id: 'p50', vendorId: 's10', restaurantName: 'Dessert World', name: 'Brownie with Ice Cream', price: 150, description: 'Warm brownie with vanilla scoop.', category: 'drinks', isVeg: true, town: 'Mauranipur' }
];
