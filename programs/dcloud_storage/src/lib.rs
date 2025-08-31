use anchor_lang::prelude::*;

declare_id!("2DWNrUtJXqnA9qu444yyACg2VXnXmEqwBPG7Q7cgM1NM");

#[program]
pub mod decentralized_cloud_storage {
    use super::*;

    pub fn initialize_storage(ctx: Context<InitializeStorage>) -> Result<()> {
        let storage_account = &mut ctx.accounts.storage_account;
        storage_account.owner = ctx.accounts.user.key();
        storage_account.total_files = 0;
        storage_account.total_storage_used = 0;
        storage_account.bump = ctx.bumps.storage_account;

        msg!(
            "Storage account initialized for user: {}",
            ctx.accounts.user.key()
        );
        Ok(())
    }

    pub fn upload_file(
        ctx: Context<UploadFile>,
        file_hash: String,
        file_name: String,
        file_size: u64,
        ipfs_hash: String,
        encryption_key: Option<String>,
    ) -> Result<()> {
        require!(file_hash.len() <= 64, StorageError::FileHashTooLong);
        require!(file_name.len() <= 100, StorageError::FileNameTooLong);
        require!(ipfs_hash.len() <= 100, StorageError::IpfsHashTooLong);
        require!(file_size > 0, StorageError::InvalidFileSize);

        let file_account = &mut ctx.accounts.file_account;
        let storage_account = &mut ctx.accounts.storage_account;

        file_account.owner = ctx.accounts.user.key();
        file_account.file_hash = file_hash;
        file_account.file_name = file_name;
        file_account.file_size = file_size;
        file_account.ipfs_hash = ipfs_hash;
        file_account.encryption_key = encryption_key;
        file_account.upload_timestamp = Clock::get()?.unix_timestamp;
        file_account.is_public = false;
        file_account.access_count = 0;
        file_account.bump = ctx.bumps.file_account;

        storage_account.total_files = storage_account.total_files.checked_add(1).unwrap();
        storage_account.total_storage_used = storage_account
            .total_storage_used
            .checked_add(file_size)
            .unwrap();

        emit!(FileUploaded {
            owner: ctx.accounts.user.key(),
            file_hash: file_account.file_hash.clone(),
            file_name: file_account.file_name.clone(),
            file_size,
            timestamp: file_account.upload_timestamp,
        });

        msg!(
            "File uploaded: {} by {}",
            file_account.file_name,
            ctx.accounts.user.key()
        );
        Ok(())
    }

    pub fn download_file(ctx: Context<DownloadFile>, _file_hash: String) -> Result<FileInfo> {
        let file_account = &mut ctx.accounts.file_account;
        let user_key = ctx.accounts.user.key();

        require!(
            file_account.owner == user_key || file_account.is_public,
            StorageError::UnauthorizedAccess
        );

        file_account.access_count = file_account.access_count.checked_add(1).unwrap();

        let file_info = FileInfo {
            owner: file_account.owner,
            file_hash: file_account.file_hash.clone(),
            file_name: file_account.file_name.clone(),
            file_size: file_account.file_size,
            ipfs_hash: file_account.ipfs_hash.clone(),
            upload_timestamp: file_account.upload_timestamp,
            is_public: file_account.is_public,
            access_count: file_account.access_count,
        };

        emit!(FileAccessed {
            accessor: user_key,
            file_hash: file_account.file_hash.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("File accessed: {} by {}", file_account.file_name, user_key);
        Ok(file_info)
    }

    pub fn delete_file(ctx: Context<DeleteFile>) -> Result<()> {
        let file_account = &ctx.accounts.file_account;
        let storage_account = &mut ctx.accounts.storage_account;

        storage_account.total_files = storage_account.total_files.checked_sub(1).unwrap();
        storage_account.total_storage_used = storage_account
            .total_storage_used
            .checked_sub(file_account.file_size)
            .unwrap();

        emit!(FileDeleted {
            owner: ctx.accounts.user.key(),
            file_hash: file_account.file_hash.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "File deleted: {} by {}",
            file_account.file_name,
            ctx.accounts.user.key()
        );
        Ok(())
    }

    pub fn share_file(ctx: Context<ShareFile>, is_public: bool) -> Result<()> {
        let file_account = &mut ctx.accounts.file_account;
        file_account.is_public = is_public;

        emit!(FileShared {
            owner: ctx.accounts.user.key(),
            file_hash: file_account.file_hash.clone(),
            is_public,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!(
            "File sharing updated: {} - public: {}",
            file_account.file_name,
            is_public
        );
        Ok(())
    }

    pub fn get_storage_info(ctx: Context<GetStorageInfo>) -> Result<StorageInfo> {
        let storage_account = &ctx.accounts.storage_account;

        let storage_info = StorageInfo {
            owner: storage_account.owner,
            total_files: storage_account.total_files,
            total_storage_used: storage_account.total_storage_used,
        };

        Ok(storage_info)
    }
}

// Account Structures
#[account]
pub struct StorageAccount {
    pub owner: Pubkey,
    pub total_files: u32,
    pub total_storage_used: u64,
    pub bump: u8,
}

#[account]
pub struct FileAccount {
    pub owner: Pubkey,
    pub file_hash: String,
    pub file_name: String,
    pub file_size: u64,
    pub ipfs_hash: String,
    pub encryption_key: Option<String>,
    pub upload_timestamp: i64,
    pub is_public: bool,
    pub access_count: u64,
    pub bump: u8,
}

// Context Structures
#[derive(Accounts)]
pub struct InitializeStorage<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 8 + 1,
        seeds = [b"storage", user.key().as_ref()],
        bump
    )]
    pub storage_account: Account<'info, StorageAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(file_hash: String)]
pub struct UploadFile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"storage", user.key().as_ref()],
        bump = storage_account.bump
    )]
    pub storage_account: Account<'info, StorageAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 64 + 4 + 100 + 8 + 4 + 100 + 1 + 4 + 256 + 8 + 1 + 8 + 1,
        seeds = [b"file", user.key().as_ref(), file_hash.as_bytes()],
        bump
    )]
    pub file_account: Account<'info, FileAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(file_hash: String)]
pub struct DownloadFile<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"file", file_account.owner.as_ref(), file_hash.as_bytes()],
        bump = file_account.bump
    )]
    pub file_account: Account<'info, FileAccount>,
}

#[derive(Accounts)]
pub struct DeleteFile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"storage", user.key().as_ref()],
        bump = storage_account.bump
    )]
    pub storage_account: Account<'info, StorageAccount>,

    #[account(
        mut,
        close = user,
        seeds = [b"file", user.key().as_ref(), file_account.file_hash.as_bytes()],
        bump = file_account.bump,
        constraint = file_account.owner == user.key() @ StorageError::UnauthorizedAccess,
    )]
    pub file_account: Account<'info, FileAccount>,
}

#[derive(Accounts)]
pub struct ShareFile<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"file", user.key().as_ref(), file_account.file_hash.as_bytes()],
        bump = file_account.bump,
        constraint = file_account.owner == user.key() @ StorageError::UnauthorizedAccess,
    )]
    pub file_account: Account<'info, FileAccount>,
}

#[derive(Accounts)]
pub struct GetStorageInfo<'info> {
    pub user: Signer<'info>,

    #[account(
        seeds = [b"storage", user.key().as_ref()],
        bump = storage_account.bump
    )]
    pub storage_account: Account<'info, StorageAccount>,
}

// Return Types
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct FileInfo {
    pub owner: Pubkey,
    pub file_hash: String,
    pub file_name: String,
    pub file_size: u64,
    pub ipfs_hash: String,
    pub upload_timestamp: i64,
    pub is_public: bool,
    pub access_count: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct StorageInfo {
    pub owner: Pubkey,
    pub total_files: u32,
    pub total_storage_used: u64,
}

// Events
#[event]
pub struct FileUploaded {
    pub owner: Pubkey,
    pub file_hash: String,
    pub file_name: String,
    pub file_size: u64,
    pub timestamp: i64,
}

#[event]
pub struct FileAccessed {
    pub accessor: Pubkey,
    pub file_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct FileDeleted {
    pub owner: Pubkey,
    pub file_hash: String,
    pub timestamp: i64,
}

#[event]
pub struct FileShared {
    pub owner: Pubkey,
    pub file_hash: String,
    pub is_public: bool,
    pub timestamp: i64,
}

// Error Codes
#[error_code]
pub enum StorageError {
    #[msg("File hash too long")]
    FileHashTooLong,
    #[msg("File name too long")]
    FileNameTooLong,
    #[msg("IPFS hash too long")]
    IpfsHashTooLong,
    #[msg("Invalid file size")]
    InvalidFileSize,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
}
