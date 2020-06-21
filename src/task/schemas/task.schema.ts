import { Schema } from 'mongoose';

const TimeSchema = new Schema(
  {
    start: Date,
    stop: Date,
    allDay: { type: Boolean, default: false },
  },
  { _id: false },
);

const Requestor = new Schema(
  {
    username: { type: String, required: true },
    confirm: { type: Boolean, default: false },
  },
  { _id: false },
);

const StaffRequest = new Schema(
  {
    group: {
      type: String,
    },
    id: {
      type: [String],
    },
  },
  { _id: false },
);

const Desc = new Schema(
  {
    msg: { type: String, index: false },
    createAt: { type: Date, default: Date.now, index: false },
  },
  { _id: false },
);

export const TaskSchema = new Schema({
  reserve: [TimeSchema],
  requestor: { type: [Requestor], index: true, required: true },
  state: { type: [String], index: true },
  staff: { type: [StaffRequest], ref: 'staffs', index: true },
  area: { type: Schema.Types.ObjectId, ref: 'areas', index: true },
  building: { type: Schema.Types.ObjectId, ref: 'area.buildings', index: true },
  // form: { type: Schema.Types.ObjectId, ref: 'forms' },
  forms: [{}],
  desc: { type: Desc, required: false },

  // use for common/area reserve
  type: {
    type: String,
    enum: ['common', 'common-sport', 'sport', 'meeting-room', 'meeting-club'],
    index: true,
  },

  createAt: { type: Date, default: Date.now, index: true },
  updateAt: { type: Date, default: Date.now },
});
