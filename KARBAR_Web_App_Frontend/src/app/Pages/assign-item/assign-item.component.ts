import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import * as XLSX from 'xlsx';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { Item } from '../../Model/item';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { AuthenticationService } from '../../Services/auth.service';
import { ItemAssignService } from '../../Services/item-assign.service';
import { SettingsService } from '../../Services/settings.service';
import { ReportService } from '../../Services/report';

@Component({
  selector: 'app-assign-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './assign-item.component.html',
  styleUrl: './assign-item.component.scss'
})
export class AssignItemComponent implements OnInit {
  lstItem: Item[] = [];
  lstDealers: any[] = [];
  lstWarehouses: any[] = [];
  lstMaterialGroups: any[] = [];

  selectedDealerIds: number[] = [];
  selectedWarehouseIds: number[] = [];
  selectedGroupIds: string[] = []; // material group codes, e.g. 'BB01'
  groupSearch: string = '';
  dealerSearch: string = '';
  isCommonItem: boolean = false;

  // Choosing a material group ticks only the items of that group; unticking a group removes them.
  // Items can still be ticked/unticked one by one.
  selectedItems = new Map<number, any>(); // item id -> item (kept for the post payload)
  groupItemIds = new Map<string, number[]>(); // group code -> item ids loaded for that group
  loadingGroupIds = new Set<string>();

  // Choosing a dealer ticks the SAP materials that dealer already has in its item list
  // (matched by material number). Unticking one by hand is remembered across pages.
  dealerMaterials = new Map<number, Map<string, number>>(); // dealer id -> material number -> dealer's status
  loadingDealerIds = new Set<number>();
  private untickedMaterials = new Set<string>();

  searchReq: SearchRequest = new SearchRequest();
  totalItems: number = 0;
  totalBergerItems: number = 0;
  statusEnum = RecordStatus;
  timer: any;
  isSaving: boolean = false;

  constructor(
    private itemAssignService: ItemAssignService,
    private settingsService: SettingsService,
    private reportService: ReportService,
    private messagHelper: MessageHelperService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    // Admin-only page: a dealer opening the URL directly goes back to the dashboard.
    if (!AuthenticationService.isAdminUser()) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const tenantId = Number(AuthenticationService.authenticatedUser?.tenantId);
    this.searchReq.tenantId = tenantId;
    this.searchReq.IsBergerItem = true;
    this.searchReq.pageIndex = 1;
    this.searchReq.pageSize = 10;

    this.getAllDealers();
    this.getAllMaterialGroups();
    this.getAllItems();
  }

  // ---------- Lookups ----------

  getAllDealers() {
    const req = new SearchRequest();
    req.pageSize = 1000;
    req.roleId = 3; // dealers only, same as the report pages
    this.reportService.fetchAllDealer(req).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        // Keep only dealers in case the API ignores RoleId
        this.lstDealers = (res.result || []).filter((d: any) => d.roleId == null || Number(d.roleId) === 3);
        const current = this.lstDealers.find(d => d.id == this.searchReq.tenantId);
        // if (current) {
        //   this.selectedDealerIds = [current.id];
        //   this.getLinkedWarehouses();
        // }
      } else {
        this.showErrors(res);
      }
    });
  }

  // { materialGroup: 'BB01', materialGroupDescription: 'Back Coat', totalCount: 226 }
  getAllMaterialGroups(onLoaded?: () => void) {
    const req = new SearchRequest();
    req.tenantId = this.searchReq.tenantId;
    req.pageSize = 1000;
    req.IsCommonItem = this.isCommonItem ? 1 : 0;
    this.itemAssignService.fetchMaterialGroups(req).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstMaterialGroups = res.result || [];
        onLoaded?.();
      } else {
        this.showErrors(res);
      }
    });
  }

  /**
   * Common items checkbox: reloads the material groups with IsCommonItem, shows them all as
   * selected and ticks every common item. Unchecking clears those groups and shows every group again.
   */
  onCommonItemChange() {
    // The table also lists only common items while the box is ticked
    this.searchReq.IsCommonItem = this.isCommonItem ? 1 : 0;
    if (this.isCommonItem) {
      this.getAllMaterialGroups(() => this.selectCommonItems());
    } else {
      this.selectedGroupIds = [];
      this.onGroupChange();
      this.getAllMaterialGroups();
    }
  }

  /**
   * Loads every common item in one paged call (instead of one call per group) and ticks them,
   * filing each item under its group so removing a group chip still unticks its items.
   */
  private selectCommonItems() {
    const pageSize = 1000;
    const codes: string[] = this.lstMaterialGroups.map(g => g.materialGroup);
    this.selectedGroupIds = codes;
    codes.forEach(code => {
      this.groupItemIds.set(code, []);
      this.loadingGroupIds.add(code);
    });
    this.onFilterChange();

    const loadPage = (pageIndex: number) => {
      const req = new SearchRequest();
      req.tenantId = this.searchReq.tenantId;
      req.IsCommonItem = 1;
      req.pageIndex = pageIndex;
      req.pageSize = pageSize;

      this.itemAssignService.fetchItems(req, [], []).subscribe({
        next: (res: ApiResponse) => {
          // Checkbox was unticked while loading
          if (!this.isCommonItem) return;
          const rows: any[] = res.isSuccess ? res.result || [] : [];
          rows.forEach(item => {
            const groupIds = this.groupItemIds.get(item.materialGroup);
            if (!groupIds || !this.selectedGroupIds.includes(item.materialGroup)) return;
            groupIds.push(item.id);
            this.selectedItems.set(item.id, item);
          });

          const totalCount = Number(res.totalCount ?? rows[0]?.totalCount ?? rows.length);
          if (rows.length > 0 && pageIndex * pageSize < totalCount) {
            loadPage(pageIndex + 1);
          } else {
            codes.forEach(code => this.loadingGroupIds.delete(code));
          }
        },
        error: () => codes.forEach(code => this.loadingGroupIds.delete(code)),
      });
    };

    loadPage(1);
  }

  /** Items expected from the selected groups (from each group's totalCount), for the progress text. */
  get expectedGroupItemCount(): number {
    return this.lstMaterialGroups
      .filter(g => this.selectedGroupIds.includes(g.materialGroup))
      .reduce((sum, g) => sum + Number(g.totalCount || 0), 0);
  }


  // ---------- Items ----------

  getAllItems() {
    // With every common group selected, IsCommonItem=1 already filters — don't send each group code
    const allCommonGroups =
      this.isCommonItem && this.lstMaterialGroups.every(g => this.selectedGroupIds.includes(g.materialGroup));
    const groups = allCommonGroups ? [] : this.selectedGroupIds;
    this.itemAssignService
      .fetchItems(this.searchReq, groups, this.selectedWarehouseIds)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstItem = res.result;
          this.totalItems = Number(res.totalCount ?? this.lstItem[0]?.totalCount ?? this.lstItem.length);
          if (!this.totalBergerItems) this.totalBergerItems = this.totalItems;
          this.tickDealerItems();
        } else {
          this.showErrors(res);
        }
      });
  }

  // ---------- Dealer items ----------

  /** Loads items for newly chosen dealers and unticks items of dealers that were removed. */
  private syncDealerItems() {
    [...this.dealerMaterials.keys(), ...this.loadingDealerIds]
      .filter(id => !this.selectedDealerIds.includes(id))
      .forEach(id => this.unselectDealerItems(id));
    this.selectedDealerIds
      .filter(id => !this.dealerMaterials.has(id) && !this.loadingDealerIds.has(id))
      .forEach(id => this.loadDealerItems(id));
  }

  /** Reads every page of one dealer's item list and keeps its material numbers. */
  private loadDealerItems(dealerId: number) {
    const pageSize = 1000;
    const materials = new Map<string, number>();
    this.loadingDealerIds.add(dealerId);

    const loadPage = (pageIndex: number) => {
      const req = new SearchRequest();
      req.tenantId = dealerId;
      req.pageIndex = pageIndex;
      req.pageSize = pageSize;

      this.itemAssignService.fetchDealerItems(req).subscribe({
        next: (res: ApiResponse) => {
          // Dealer was removed while loading
          if (!this.selectedDealerIds.includes(dealerId)) {
            this.loadingDealerIds.delete(dealerId);
            return;
          }
          const rows: any[] = res.isSuccess ? res.result || [] : [];
          rows.forEach(item => {
            if (item.materialNumber) materials.set(String(item.materialNumber).trim(), Number(item.status));
          });

          const totalCount = Number(res.totalCount ?? rows[0]?.totalCount ?? rows.length);
          if (rows.length > 0 && pageIndex * pageSize < totalCount) {
            loadPage(pageIndex + 1);
          } else {
            this.dealerMaterials.set(dealerId, materials);
            this.loadingDealerIds.delete(dealerId);
            this.tickDealerItems();
          }
        },
        error: () => this.loadingDealerIds.delete(dealerId),
      });
    };

    loadPage(1);
  }

  private unselectDealerItems(dealerId: number) {
    this.dealerMaterials.delete(dealerId);
    this.loadingDealerIds.delete(dealerId);
    // Untick items that no remaining dealer has (items ticked by a material group stay)
    const groupIds = new Set([...this.groupItemIds.values()].flat());
    [...this.selectedItems.values()]
      .filter(item => !this.isDealerItem(item) && !groupIds.has(item.id))
      .forEach(item => this.selectedItems.delete(item.id));
  }

  /** True when any selected dealer already has this material. */
  isDealerItem(item: any): boolean {
    const no = String(item.materialNumber ?? '').trim();
    return !!no && [...this.dealerMaterials.values()].some(set => set.has(no));
  }

  /**
   * On/off of a material across the selected dealers:
   * 'on' = active for every selected dealer, 'off' = active for none,
   * 'mixed' = active for some, 'none' = no selected dealer has it yet.
   */
  dealerStatus(item: any): 'on' | 'off' | 'mixed' | 'none' {
    const no = String(item.materialNumber ?? '').trim();
    const statuses = this.selectedDealerIds
      .map(id => this.dealerMaterials.get(id)?.get(no))
      .filter(status => status !== undefined);
    if (!statuses.length) return 'none';
    const activeCount = statuses.filter(status => status === this.statusEnum.Active).length;
    if (activeCount === this.selectedDealerIds.length) return 'on';
    return activeCount === 0 ? 'off' : 'mixed';
  }

  dealerStatusLabel(item: any): string {
    switch (this.dealerStatus(item)) {
      case 'on': return 'On';
      case 'off': return 'Off';
      case 'none': return 'Not assigned';
      default: {
        const no = String(item.materialNumber ?? '').trim();
        const activeCount = this.selectedDealerIds
          .filter(id => this.dealerMaterials.get(id)?.get(no) === this.statusEnum.Active).length;
        return `${activeCount}/${this.selectedDealerIds.length} on`;
      }
    }
  }

  /** Turns the material on (or off when it is on for every dealer) for all selected dealers. */
  toggleDealerStatus(item: any) {
    if (!this.canSubmit(false)) return;
    const status = this.dealerStatus(item) === 'on' ? this.statusEnum.Inactive : this.statusEnum.Active;
    const dealerIds = [...this.selectedDealerIds];
    const no = String(item.materialNumber ?? '').trim();

    this.isSaving = true;
    this.itemAssignService.assignItems(this.buildPayload(status, [item])).subscribe({
      next: (res: ApiResponse) => {
        this.isSaving = false;
        if (res.isSuccess) {
          // Update locally so the switch flips without reloading every dealer list
          dealerIds.forEach(id => this.dealerMaterials.get(id)?.set(no, status));
          this.messagHelper.showMessage(200, `Turned ${status === this.statusEnum.Active ? 'on' : 'off'} for selected dealer(s)`);
        } else {
          this.showErrors(res);
        }
      },
      error: () => (this.isSaving = false),
    });
  }

  /** Ticks the dealer's materials on the current page, except ones the user unticked. */
  private tickDealerItems() {
    this.lstItem
      .filter(item => this.isDealerItem(item) && !this.untickedMaterials.has(String(item.materialNumber).trim()))
      .forEach(item => this.selectedItems.set(item.id, item));
  }

  /** True when the item belongs to the material group (checked on the client as well). */
  private isInGroup(item: any, groupCode: string): boolean {
    return item.materialGroup === groupCode;
  }

  /** Loads every item (all pages) of one material group and ticks only those items. */
  private selectGroupItems(groupId: string) {
    const pageSize = 1000;
    const groupItems: any[] = [];
    this.loadingGroupIds.add(groupId);

    const loadPage = (pageIndex: number) => {
      const req = new SearchRequest();
      req.tenantId = this.searchReq.tenantId;
      req.IsBergerItem = true;
      req.pageIndex = pageIndex;
      req.pageSize = pageSize;

      this.itemAssignService.fetchItems(req, [groupId], []).subscribe({
        next: (res: ApiResponse) => {
          // Group was removed while loading
          if (!this.selectedGroupIds.includes(groupId)) {
            this.loadingGroupIds.delete(groupId);
            return;
          }
          const rows: any[] = res.isSuccess ? res.result || [] : [];
          const pageItems = rows.filter(item => this.isInGroup(item, groupId));
          groupItems.push(...pageItems);
          // Tick as each page arrives so the selected count grows while loading
          pageItems.forEach(item => this.selectedItems.set(item.id, item));
          this.groupItemIds.set(groupId, groupItems.map(item => item.id));

          const totalCount = Number(res.totalCount ?? rows[0]?.totalCount ?? rows.length);
          if (rows.length > 0 && pageIndex * pageSize < totalCount) {
            loadPage(pageIndex + 1);
          } else {
            this.loadingGroupIds.delete(groupId);
          }
        },
        error: () => this.loadingGroupIds.delete(groupId),
      });
    };

    loadPage(1);
  }

  /** Unticks the items that were selected through a material group. */
  private unselectGroupItems(groupId: string) {
    (this.groupItemIds.get(groupId) || []).forEach(id => this.selectedItems.delete(id));
    this.groupItemIds.delete(groupId);
    this.loadingGroupIds.delete(groupId);
  }

  onFilterChange() {
    this.searchReq.pageIndex = 1;
    this.getAllItems();
  }

  onSearch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.onFilterChange(), 400);
  }

  onDealerChange() {
    this.syncDealerItems();
    this.onFilterChange();
  }


  onGroupChange() {
    const previous = [...this.groupItemIds.keys(), ...this.loadingGroupIds];
    previous
      .filter(id => !this.selectedGroupIds.includes(id))
      .forEach(id => this.unselectGroupItems(id));
    this.selectedGroupIds
      .filter(id => !this.groupItemIds.has(id) && !this.loadingGroupIds.has(id))
      .forEach(id => this.selectGroupItems(id));
    this.onFilterChange();
  }

  removeDealer(event: Event, id: number) {
    event.stopPropagation();
    this.selectedDealerIds = this.selectedDealerIds.filter(x => x !== id);
    this.onDealerChange();
  }



  removeGroup(event: Event, code: string) {
    event.stopPropagation();
    this.selectedGroupIds = this.selectedGroupIds.filter(x => x !== code);
    this.onGroupChange();
  }

  nameOf(list: any[], id: number): string {
    return list.find(x => x.id == id)?.name ?? '';
  }

  matchesGroupSearch(group: any): boolean {
    const q = this.groupSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (group.materialGroup || '').toLowerCase().includes(q) ||
      (group.materialGroupDescription || '').toLowerCase().includes(q)
    );
  }

  get visibleGroupCount(): number {
    return this.lstMaterialGroups.filter(g => this.matchesGroupSearch(g)).length;
  }

  matchesDealerSearch(dealer: any): boolean {
    const q = this.dealerSearch.trim().toLowerCase();
    if (!q) return true;
    return [dealer.name, dealer.tenantCustomerNo, dealer.code, dealer.dealerCode, dealer.phone]
      .some(value => String(value ?? '').toLowerCase().includes(q));
  }

  get visibleDealerCount(): number {
    return this.lstDealers.filter(d => this.matchesDealerSearch(d)).length;
  }

  /** Focus the search box when a panel opens; clear it when it closes. */
  onSearchPanelToggle(opened: boolean, input: HTMLInputElement, list: 'group' | 'dealer') {
    if (opened) {
      setTimeout(() => input.focus());
    } else if (list === 'group') {
      this.groupSearch = '';
    } else {
      this.dealerSearch = '';
    }
  }

  groupName(code: string): string {
    return this.lstMaterialGroups.find(g => g.materialGroup === code)?.materialGroupDescription || code;
  }

  // ---------- Pagination ----------

  get pageStart(): number {
    return this.totalItems ? (this.searchReq.pageIndex - 1) * this.searchReq.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.searchReq.pageIndex * this.searchReq.pageSize, this.totalItems);
  }

  get hasNextPage(): boolean {
    return this.pageEnd < this.totalItems;
  }

  changePage(step: number) {
    this.searchReq.pageIndex += step;
    this.getAllItems();
  }

  // ---------- Selection ----------

  get isGroupMode(): boolean {
    return this.selectedGroupIds.length > 0;
  }

  get isSelectingGroups(): boolean {
    return this.loadingGroupIds.size > 0;
  }

  get selectedCount(): number {
    return this.selectedItems.size;
  }

  isSelected(item: Item): boolean {
    return this.selectedItems.has(item.id);
  }

  setSelected(item: Item, select: boolean) {
    select ? this.selectedItems.set(item.id, item) : this.selectedItems.delete(item.id);
    if (this.isDealerItem(item)) {
      const no = String(item.materialNumber).trim();
      select ? this.untickedMaterials.delete(no) : this.untickedMaterials.add(no);
    }
  }

  toggleItem(item: Item) {
    this.setSelected(item, !this.isSelected(item));
  }

  get allPageSelected(): boolean {
    return this.lstItem.length > 0 && this.lstItem.every(i => this.isSelected(i));
  }

  get somePageSelected(): boolean {
    return this.lstItem.some(i => this.isSelected(i)) && !this.allPageSelected;
  }

  toggleAllOnPage() {
    const select = !this.allPageSelected;
    this.lstItem.forEach(i => this.setSelected(i, select));
  }

  private clearSelection() {
    this.selectedItems.clear();
    this.groupItemIds.clear();
    this.loadingGroupIds.clear();
    this.selectedGroupIds = [];
    // Dealer lists changed after the save; read them again so the ticks stay correct
    this.untickedMaterials.clear();
    this.dealerMaterials.clear();
    this.loadingDealerIds.clear();
    this.syncDealerItems();
    this.onFilterChange();
  }

  // ---------- Actions ----------

  /**
   * Post model for assign and Active/Inactive:
   * { tenantIds, items: [{ itemId, itemName, brandName, categoryName, status }] }
   * Uses the selected items, or the given items (single row switch).
   */
  private buildPayload(status: number, items?: any[]) {
    return {
      tenantIds: this.selectedDealerIds,
      items: (items ?? [...this.selectedItems.values()]).map(item => ({
        itemId: item.id ?? item.itemId,
        itemName: item.materialDescription ?? item.itemName ?? item.name ?? '',
        materialNumber:item.materialNumber,
        brandName: item.materialGroupDescription ?? item.categoryName ?? '',
        sizeOrPackSize: item.sizeOrPackSize ?? '',
        baseUnitOfMeasure: item.sizeOrPackSize ?? '',
        mrp: item.mrp ?? 0,
        categoryName: null,
        status,
      })),
    };
  }

  private canSubmit(checkItems: boolean = true): boolean {
    if (!this.selectedDealerIds.length) {
      this.messagHelper.showMessage(400, 'Please select at least one dealer');
      return false;
    }
    if (checkItems && this.isSelectingGroups) {
      this.messagHelper.showMessage(400, 'Please wait, selecting material group items…');
      return false;
    }
    if (checkItems && !this.selectedCount) {
      this.messagHelper.showMessage(400, 'Please select at least one item');
      return false;
    }
    return true;
  }

  assignSelected() {
    if (!this.canSubmit()) return;
    this.isSaving = true;
    this.itemAssignService.assignItems(this.buildPayload(this.statusEnum.Active)).subscribe({
      next: (res: ApiResponse) => {
        this.isSaving = false;
        if (res.isSuccess) {
          this.messagHelper.showMessage(200, 'Items assigned successfully');
          this.clearSelection();
          this.getAllItems();
        } else {
          this.showErrors(res);
        }
      },
      error: () => (this.isSaving = false),
    });
  }

  setSelectedStatus(active: boolean) {
    if (!this.canSubmit()) return;
    this.updateStatus(active, undefined, () => this.clearSelection());
  }

  toggleRowStatus(item: Item, active: boolean) {
    if (!this.canSubmit(false)) return;
    this.updateStatus(active, [item]);
  }

  private updateStatus(active: boolean, items?: any[], onSuccess?: () => void) {
    const status = active ? this.statusEnum.Active : this.statusEnum.Inactive;
    this.isSaving = true;
    this.itemAssignService.assignItems(this.buildPayload(status, items)).subscribe({
      next: (res: ApiResponse) => {
        this.isSaving = false;
        if (res.isSuccess) {
          const alreadyInactive: any[] = (!active && res.result?.alreadyInactive) || [];
          if (alreadyInactive.length) {
            this.confirmReactivate(alreadyInactive);
          } else {
            this.messagHelper.showMessage(200, `Items set ${active ? 'active' : 'inactive'}`);
          }
          onSuccess?.();
        } else {
          this.showErrors(res);
        }
        this.getAllItems();
      },
      error: () => {
        this.isSaving = false;
        this.getAllItems();
      },
    });
  }

  /**
   * The API skips (dealer, item) pairs that were already inactive and returns them as
   * result.alreadyInactive: [{ tenantId, dealerName, itemId, materialNumber, itemName }].
   * Ask whether to make those active again instead.
   */
  private confirmReactivate(pairs: any[]) {
    const lines = pairs.map(p => {
      const dealer = p.dealerName || this.nameOf(this.lstDealers, p.tenantId) || `Dealer ${p.tenantId}`;
      return `${p.itemName || p.materialNumber} (${dealer})`;
    });
    const subject = pairs.length === 1
      ? `${lines[0]} is already inactive for this dealer.`
      : `These products are already inactive: ${lines.join(', ')}.`;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { width: '420px' });
    dialogRef.componentInstance.title = 'Already Inactive';
    dialogRef.componentInstance.message = `${subject} Do you want to make ${pairs.length === 1 ? 'it' : 'them'} active now?`;

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.reactivate(pairs);
    });
  }

  /** Posts status Active per dealer, only for the items that dealer had inactive. */
  private reactivate(pairs: any[]) {
    const byDealer = new Map<number, any[]>();
    pairs.forEach(p => byDealer.set(p.tenantId, [...(byDealer.get(p.tenantId) || []), p]));

    const requests = [...byDealer.entries()].map(([tenantId, dealerPairs]) =>
      this.itemAssignService.assignItems({
        ...this.buildPayload(this.statusEnum.Active, dealerPairs.map(p => this.findItem(p))),
        tenantIds: [tenantId],
      })
    );

    this.isSaving = true;
    forkJoin(requests).subscribe({
      next: (responses: any[]) => {
        this.isSaving = false;
        const failed = (responses as ApiResponse[]).filter(r => !r.isSuccess);
        if (failed.length) {
          failed.forEach(r => this.showErrors(r));
        } else {
          this.messagHelper.showMessage(200, 'Items set active');
        }
        this.getAllItems();
      },
      error: () => {
        this.isSaving = false;
        this.getAllItems();
      },
    });
  }

  /** Full item for a returned pair (from the page or the selection); falls back to the pair itself. */
  private findItem(pair: any): any {
    const match = (item: any) =>
      (pair.materialNumber && item.materialNumber === pair.materialNumber) ||
      (pair.itemId && item.id === pair.itemId);
    return this.lstItem.find(match) ?? [...this.selectedItems.values()].find(match) ?? pair;
  }

  // ---------- Template / Bulk upload ----------

  downloadTemplate() {
    const rows = [{ 'Dealer Code': '', 'Warehouse Code': '', 'Material Number': '', 'Status (Active/Inactive)': 'Active' }];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Assign Items');
    XLSX.writeFile(workbook, 'assign-item-template.xlsx');
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('File', file);

    this.itemAssignService.bulkUpload(formData).subscribe({
      next: (res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(200, res.result || 'Upload successful');
          this.getAllItems();
        } else {
          this.messagHelper.showMessage(400, res.result || 'Upload failed');
        }
        event.target.value = '';
      },
      error: (err: any) => {
        this.messagHelper.showMessage(500, err?.error?.message || 'Upload error');
        event.target.value = '';
      },
    });
  }

  private showErrors(res: ApiResponse) {
    res.errorMessage?.forEach(msg => this.messagHelper.showMessage(res.statusCode, msg));
  }
}
