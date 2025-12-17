#!/usr/bin/env python3
"""Seed sample purchasing data (purchase orders and goods receipts)."""
import sys
from pathlib import Path
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlmodel import Session, select

# Ensure backend package is importable
BACKEND_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.infrastructure.shared.database.connection import engine
from app.infrastructure.shared.database.models import (
    ItemModel,
    StoreLocationModel,
    PurchaseOrderModel,
    PurchaseOrderLineModel,
    GoodsReceiptModel,
    GoodsReceiptLineModel,
)
from app.shared.enums import LocationTypeEnum


TENANT_ID = "seed-tenant-purchasing"


def get_or_create_item(session: Session, sku: str, name: str) -> ItemModel:
    item = session.exec(
        select(ItemModel).where(
            ItemModel.tenant_id == TENANT_ID,
            ItemModel.sku == sku,
        )
    ).first()

    if item:
        return item

    item = ItemModel(
        tenant_id=TENANT_ID,
        sku=sku,
        name=name,
        description=f"Seed item {name}",
        default_uom="EA",
        item_type="product",
        item_usage="for_sale",
        tracking_scope="both",
        tracking_requirements=[],
        perishable=False,
        active=True,
    )
    session.add(item)
    session.flush()
    print(f"  ✓ Created item {sku} ({item.id})")
    return item


def get_or_create_warehouse(session: Session, code: str) -> StoreLocationModel:
    warehouse = session.exec(
        select(StoreLocationModel).where(
            StoreLocationModel.tenant_id == TENANT_ID,
            StoreLocationModel.code == code,
        )
    ).first()

    if warehouse:
        return warehouse

    warehouse = StoreLocationModel(
        tenant_id=TENANT_ID,
        location_type=LocationTypeEnum.WAREHOUSE,
        code=code,
        name="Seed Warehouse",
        address={
            "line1": "123 Purchase Ave",
            "city": "Austin",
            "state": "TX",
            "country": "USA",
        },
    )
    session.add(warehouse)
    session.flush()
    print(f"  ✓ Created warehouse {code} ({warehouse.id})")
    return warehouse


def create_purchase_order(session: Session, warehouse: StoreLocationModel, item: ItemModel) -> PurchaseOrderModel:
    existing_po = session.exec(
        select(PurchaseOrderModel).where(
            PurchaseOrderModel.tenant_id == TENANT_ID,
            PurchaseOrderModel.po_number == "PO-SEED-001",
        )
    ).first()

    if existing_po:
        print(f"  • Purchase order {existing_po.po_number} already exists")
        line = session.exec(
            select(PurchaseOrderLineModel).where(
                PurchaseOrderLineModel.purchase_order_id == existing_po.id,
                PurchaseOrderLineModel.tenant_id == TENANT_ID,
            )
        ).first()
        if not line:
            line = PurchaseOrderLineModel(
                tenant_id=TENANT_ID,
                purchase_order_id=existing_po.id,
                item_id=item.id,
                description="Demo widgets",
                quantity=Decimal("25"),
                uom="EA",
                unit_price=Decimal("12.50"),
                status="open",
                expected_date=date.today(),
                received_quantity=Decimal("0"),
                cancelled_quantity=Decimal("0"),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(line)
            session.flush()
            print(f"    ✓ Added missing PO line {line.id}")
        return existing_po

    po = PurchaseOrderModel(
        tenant_id=TENANT_ID,
        supplier_id="supplier-demo-001",
        warehouse_id=warehouse.id,
        po_number="PO-SEED-001",
        status="approved",
        currency="USD",
        expected_date=date.today(),
        notes="Seed purchase order for demo.",
        reference="REF-PO-001",
        created_by="user-seeder",
        version=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(po)
    session.flush()

    line = PurchaseOrderLineModel(
        tenant_id=TENANT_ID,
        purchase_order_id=po.id,
        item_id=item.id,
        description="Demo widgets",
        quantity=Decimal("25"),
        uom="EA",
        unit_price=Decimal("12.50"),
        status="open",
        expected_date=date.today(),
        received_quantity=Decimal("0"),
        cancelled_quantity=Decimal("0"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(line)
    session.flush()

    print(f"  ✓ Created purchase order {po.po_number} with line {line.id}")
    return po


def create_goods_receipt(
    session: Session,
    warehouse: StoreLocationModel,
    purchase_order: PurchaseOrderModel,
) -> GoodsReceiptModel:
    po_line = session.exec(
        select(PurchaseOrderLineModel).where(
            PurchaseOrderLineModel.purchase_order_id == purchase_order.id,
            PurchaseOrderLineModel.tenant_id == TENANT_ID,
        )
    ).first()

    if po_line is None:
        raise RuntimeError("Expected purchase order line for seed data")

    existing_receipt = session.exec(
        select(GoodsReceiptModel).where(
            GoodsReceiptModel.tenant_id == TENANT_ID,
            GoodsReceiptModel.receipt_number == "GR-SEED-001",
        )
    ).first()

    if existing_receipt:
        print(f"  • Goods receipt {existing_receipt.receipt_number} already exists")
        receipt_line = session.exec(
            select(GoodsReceiptLineModel).where(
                GoodsReceiptLineModel.goods_receipt_id == existing_receipt.id,
                GoodsReceiptLineModel.tenant_id == TENANT_ID,
            )
        ).first()
        if not receipt_line:
            receipt_line = GoodsReceiptLineModel(
                tenant_id=TENANT_ID,
                goods_receipt_id=existing_receipt.id,
                purchase_order_line_id=po_line.id,
                item_id=po_line.item_id,
                quantity=Decimal("10"),
                uom="EA",
                status="received",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(receipt_line)
            session.flush()
            print(f"    ✓ Added missing goods receipt line {receipt_line.id}")
        return existing_receipt

    receipt = GoodsReceiptModel(
        tenant_id=TENANT_ID,
        warehouse_id=warehouse.id,
        purchase_order_id=purchase_order.id,
        receipt_number="GR-SEED-001",
        status="putaway",
        received_at=datetime.now(timezone.utc),
        notes="Seed receipt for PO-SEED-001",
        version=0,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(receipt)
    session.flush()

    receipt_line = GoodsReceiptLineModel(
        tenant_id=TENANT_ID,
        goods_receipt_id=receipt.id,
        purchase_order_line_id=po_line.id,
        item_id=po_line.item_id,
        quantity=Decimal("10"),
        uom="EA",
        status="received",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    session.add(receipt_line)

    po_line.received_quantity += Decimal("10")
    po_line.status = "partially_received"
    po_line.updated_at = datetime.now(timezone.utc)

    purchase_order.status = "partially_received"
    purchase_order.updated_at = datetime.now(timezone.utc)

    print(f"  ✓ Created goods receipt {receipt.receipt_number} with line {receipt_line.id}")
    return receipt


def main() -> None:
    with Session(engine) as session:
        print("Seeding purchasing data...\n")

        item = get_or_create_item(session, sku="WIDGET-001", name="Demo Widget")
        warehouse = get_or_create_warehouse(session, code="WH-PURCH-001")

        purchase_order = create_purchase_order(session, warehouse, item)
        create_goods_receipt(session, warehouse, purchase_order)

        session.commit()

        print("\nSeed data created successfully for tenant:", TENANT_ID)


if __name__ == "__main__":
    main()

