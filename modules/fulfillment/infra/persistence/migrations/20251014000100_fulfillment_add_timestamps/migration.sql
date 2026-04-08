-- Fulfillment baseline alignment: add timestamps and helpful indexes
-- Ensures compatibility with code expecting created_at/updated_at fields

-- Add timestamps to shipments
ALTER TABLE fulfillment.shipments
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add timestamps to shipment_items
ALTER TABLE fulfillment.shipment_items
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Indexes to support common queries
CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_order_id
  ON fulfillment.shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_status
  ON fulfillment.shipments(status);

CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_created_at
  ON fulfillment.shipments(created_at);

