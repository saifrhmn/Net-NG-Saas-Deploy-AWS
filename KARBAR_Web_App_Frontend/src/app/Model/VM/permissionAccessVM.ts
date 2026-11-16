export class PermissionAccessVM {
  permissionName: string;
  parentPermissionName: string;
  permissionAccessId: string;
  roleId: string;
  permissionId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isChecked: boolean = false;
}
