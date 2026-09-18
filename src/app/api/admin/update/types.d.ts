export interface GitHubRepositoryResponse {
	default_branch?: string;
	message?: string;
}

export interface GitHubContentResponse {
	content?: string;
	encoding?: string;
	message?: string;
}

export interface GitHubWorkflowDispatchResponse {
	workflow_run_id?: number;
	html_url?: string;
	message?: string;
}

export interface PackageMetadata {
	version?: string;
}

export interface UpdateDispatchConfig {
	repository: string;
	ref?: string;
	token: string;
}

export interface UpdateStatus {
	available: boolean;
	currentVersion: string;
	repository: string;
	targetVersion: string;
}
