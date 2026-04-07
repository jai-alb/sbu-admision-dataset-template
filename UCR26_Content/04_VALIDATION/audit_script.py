import json
import os
import glob

def audit_batches():
    base_path = r'c:\Cyboring_Global\5_Ventures\sbu-admision\SBU-admision-engine\UCR26_Content\03_ITEM_PRODUCTION\BATCHES'
    batch_files = sorted(glob.glob(os.path.join(base_path, 'batch_*.json')))
    
    global_pass = True
    batch_summaries = []
    error_details = []
    
    # Expected domains
    domains = {
        'item_type': ['diagnostic', 'simulation', 'training'],
        'macro_area': ['RCV', 'RCM'],
        'skill': ['H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
        'difficulty': [1, 2, 3],
        'H1': ['baja', 'media', 'alta']
    }
    
    mandatory_fields = [
        'item_id', 'item_type', 'macro_area', 'skill', 
        'difficulty', 'H1', 'template_id', 'prompt_id'
    ]
    
    for batch_file in batch_files:
        batch_id = os.path.basename(batch_file)
        total_items = 0
        items_checked = 0
        missing_fields_count = 0
        invalid_values_count = 0
        
        try:
            with open(batch_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Assume data is a list of items or contains a 'items' list
            items = data if isinstance(data, list) else data.get('items', [])
            total_items = len(items)
            
            for item in items:
                # If there's a status field, only check 'approved'
                status = item.get('status')
                # If status exists but is not approved, we ignore it as per instructions
                # If status doesn't exist, we assume we check it (or it's implied approved)
                if status and status != 'approved':
                    continue
                
                items_checked += 1
                item_id = item.get('item_id', 'UNKNOWN')
                
                # Check existence and nulls
                for field in mandatory_fields:
                    val = item.get(field)
                    if val is None:
                        missing_fields_count += 1
                        global_pass = False
                        error_details.append({
                            'batch_id': batch_id,
                            'item_id': item_id,
                            'error': f'missing field: {field}',
                            'value': 'None'
                        })
                    elif field in domains:
                        if val not in domains[field]:
                            invalid_values_count += 1
                            global_pass = False
                            error_details.append({
                                'batch_id': batch_id,
                                'item_id': item_id,
                                'error': f'invalid value in {field}',
                                'value': str(val)
                            })
                            
        except Exception as e:
            print(f"Error reading {batch_id}: {e}")
            global_pass = False
            
        batch_summaries.append({
            'batch_id': batch_id,
            'total_items': total_items,
            'items_checked': items_checked,
            'missing_fields_count': missing_fields_count,
            'invalid_values_count': invalid_values_count
        })
        
    # Output Generation
    print("A. Resultado global")
    print(f"STATUS: {'PASS' if global_pass else 'FAIL'}")
    print("\nB. Resumen por batch")
    print(f"{'batch_id':<20} | {'total':<6} | {'checked':<8} | {'missing':<8} | {'invalid':<8}")
    print("-" * 60)
    for s in batch_summaries:
        print(f"{s['batch_id']:<20} | {s['total_items']:<6} | {s['items_checked']:<8} | {s['missing_fields_count']:<8} | {s['invalid_values_count']:<8}")
        
    if not global_pass:
        print("\nC. Detalle de errores")
        print(f"{'batch_id':<20} | {'item_id':<20} | {'error':<25} | {'value'}")
        print("-" * 80)
        for e in error_details:
            print(f"{e['batch_id']:<20} | {e['item_id']:<20} | {e['error']:<25} | {e['value']}")

if __name__ == "__main__":
    audit_batches()
