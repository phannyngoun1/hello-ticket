#!/bin/bash
cd /Users/ngounphanny/dev/envs/projects/truths
echo -e "customer\nsales\nsales\n2\ny\ny\ny\nn\ny\ny\ny\n/sales/customers\n\nCREATE_SALES_CUSTOMER\nVIEW_SALES_CUSTOMER\nUPDATE_SALES_CUSTOMER\nDELETE_SALES_CUSTOMER\ny\ny\nsales\n/api/v1/sales/customers\nUsers\ny\ny" | node tools/create-crud-unified.cjs

