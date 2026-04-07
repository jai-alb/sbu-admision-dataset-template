$basePath = "c:\Cyboring_Global\5_Ventures\sbu-admision\SBU-admision-engine\UCR26_Content\03_ITEM_PRODUCTION\BATCHES"
$batchFiles = Get-ChildItem -Path "$basePath/batch_*.json" | Sort-Object Name
$globalPass = $true
$batchSummaries = @()
$errorDetails = @()

$domains = @{
    "item_type" = "diagnostic", "simulation", "training"
    "macro_area" = "RCV", "RCM"
    "skill" = "H2", "H3", "H4", "H5", "H6", "H7"
    "difficulty" = 1, 2, 3
    "H1" = "baja", "media", "alta"
}

$mandatoryFields = "item_id", "item_type", "macro_area", "skill", "difficulty", "H1", "template_id", "prompt_id"

foreach ($file in $batchFiles) {
    $batchId = $file.Name
    $totalItems = 0
    $itemsChecked = 0
    $missingFieldsCount = 0
    $invalidValuesCount = 0
    
    try {
        $content = Get-Content -Raw $file.FullName
        $data = $content | ConvertFrom-Json
        
        # Determine items array
        if ($data -is [PSCustomObject] -and $data.PSObject.Properties["items"]) {
            $items = $data.items
        } elseif ($data -is [Array]) {
            $items = $data
        } else {
            $items = @($data)
        }
        
        $totalItems = $items.Count
        
        foreach ($item in $items) {
            # Skip if status exists and is not approved
            if ($item.status -and $item.status -ne "approved") {
                continue
            }
            
            $itemsChecked++
            $itemId = if ($item.item_id) { $item.item_id } else { "UNKNOWN" }
            
            foreach ($field in $mandatoryFields) {
                $val = $item.$field
                if ($null -eq $val -or "" -eq $val) {
                    $missingFieldsCount++
                    $globalPass = $false
                    $errorDetails += [PSCustomObject]@{
                        batch_id = $batchId
                        item_id = $itemId
                        error = "missing field: $field"
                        value = "None"
                    }
                } elseif ($domains.ContainsKey($field)) {
                    $domain = $domains[$field]
                    if ($domain -notcontains $val) {
                        $invalidValuesCount++
                        $globalPass = $false
                        $errorDetails += [PSCustomObject]@{
                            batch_id = $batchId
                            item_id = $itemId
                            error = "invalid value in $field"
                            value = $val
                        }
                    }
                }
            }
        }
    } catch {
        Write-Error "Error reading $batchId : $_"
        $globalPass = $false
    }
    
    $batchSummaries += [PSCustomObject]@{
        batch_id = $batchId
        total_items = $totalItems
        items_checked = $itemsChecked
        missing_fields_count = $missingFieldsCount
        invalid_values_count = $invalidValuesCount
    }
}

Write-Host "A. Resultado global"
if ($globalPass) { Write-Host "STATUS: PASS" } else { Write-Host "STATUS: FAIL" }

Write-Host "`nB. Resumen por batch"
$batchSummaries | Format-Table -AutoSize

if (-not $globalPass) {
    Write-Host "`nC. Detalle de errores"
    $errorDetails | Format-Table -AutoSize
}
