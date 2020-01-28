const mongoose = require('mongoose');
const { Schema } = mongoose;

const favoriteSchema = new Schema({
  placeId: { // 구글 API에서 제공하는 장소ID
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: [Number],
    index: '2dsphere' // 몽고디비에서 제공하는 경도, 위도 전용 자료형
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Favorite', favoriteSchema);