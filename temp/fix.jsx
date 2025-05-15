{filteredProfiles.length === 0 ? (
    <Box className="modern-empty-state">
        <Box className="modern-empty-state-icon">
            <SearchIcon sx={{ fontSize: 48, color: '#94a3b8' }} />
        </Box>
        <Typography variant="h5" className="modern-empty-state-title" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
            No profiles found
        </Typography>
        <Typography variant="body1" className="modern-empty-state-text" sx={{ color: '#64748b', mb: 3, textAlign: 'center', maxWidth: '500px' }}>
            {searchQuery 
                ? 'No profiles match your search criteria. Try adjusting your filters or search term.' 
                : 'There are no profiles available. Create a new profile to get started.'}
        </Typography>
        {!searchQuery && (
            <Button
                variant="contained"
                onClick={() => {
                    setEditingProfile(null);
                    setNewProfile({
                        name: "",
                        description: "",
                        status: "active",
                        modules: initialModuleState
                    });
                    setOpenDialog(true);
                }}
                sx={{
                    background: 'linear-gradient(45deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: '12px',
                    padding: '10px 24px',
                    height: '48px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&:hover': {
                        background: 'linear-gradient(45deg, #4338ca 0%, #6d28d9 100%)',
                        boxShadow: '0 6px 20px rgba(79, 70, 229, 0.35)',
                        transform: 'translateY(-2px)'
                    }
                }}
                startIcon={<AddIcon />}
            >
                Create your first profile
            </Button>
        )}
    </Box>
) : viewMode === 'grid' ? (
    <Grid container spacing={3}>
        {filteredProfiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={profile.id}>
                <Paper 
                    elevation={0} 
                    className="modern-profile-card"
                    onClick={(e) => handleProfileClick(profile, e)}
                    sx={{
                        p: 0,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        backgroundColor: 'white',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative',
                        '&:hover': {
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                            transform: 'translateY(-5px)',
                            '& .card-actions': {
                                opacity: 1,
                                transform: 'translateY(0)'
                            }
                        }
                    }}
                >
                    <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        height: '6px', 
                        backgroundColor: profile.status === 'active' ? '#10b981' : '#ef4444',
                        opacity: 0.9
                    }} />
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar
                                sx={{
                                    width: 56,
                                    height: 56,
                                    bgcolor: getAvatarColor(profile.id),
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    mr: 2,
                                    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)'
                                }}
                            >
                                {getInitials(profile.name)}
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                                    {profile.name}
                                </Typography>
                                <StatusBadge status={profile.status} />
                            </Box>
                        </Box>
                        <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#64748b'
                            }}
                        >
                            {profile.description || 'No description available'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {profile.modules?.slice(0, 3).map(moduleId => {
                                const module = modules.find(m => m.id === moduleId);
                                return module ? (
                                    <Chip
                                        key={module.id}
                                        label={module.title}
                                        size="small"
                                        sx={{ 
                                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                                            color: '#4f46e5',
                                            fontWeight: 500,
                                            borderRadius: '6px',
                                            border: '1px solid rgba(99, 102, 241, 0.2)'
                                        }}
                                    />
                                ) : null;
                            })}
                            {profile.modules?.length > 3 && (
                                <Chip
                                    label={`+${profile.modules.length - 3}`}
                                    size="small"
                                    sx={{ 
                                        bgcolor: 'rgba(148, 163, 184, 0.1)',
                                        color: '#64748b',
                                        fontWeight: 500,
                                        borderRadius: '6px',
                                        border: '1px solid rgba(148, 163, 184, 0.2)'
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                    <Box 
                        className="card-actions"
                        sx={{ 
                            p: 2, 
                            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            opacity: 0.8,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Tooltip title={t('profiles.viewDetails')}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleProfileClick(profile, e);
                                }}
                                sx={{ 
                                    color: '#4f46e5',
                                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(79, 70, 229, 0.2)',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('profiles.edit')}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(profile.id);
                                }}
                                sx={{ 
                                    color: '#3b82f6',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('profiles.delete')}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(profile.id);
                                }}
                                sx={{ 
                                    color: '#ef4444',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
            </Grid>
        ))}
    </Grid>
) : (
    <Box className="modern-table-container" sx={{ 
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        backgroundColor: 'white'
    }}>
        <table className="modern-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8fafc', 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem',
                        position: 'relative'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={filteredProfiles.length > 0 && selectedProfiles.length === filteredProfiles.length}
                                indeterminate={selectedProfiles.length > 0 && selectedProfiles.length < filteredProfiles.length}
                                onChange={handleHeaderCheckboxClick}
                                size="small"
                                sx={{
                                    color: '#94a3b8',
                                    '&.Mui-checked': {
                                        color: '#4f46e5',
                                    },
                                    '&.MuiCheckbox-indeterminate': {
                                        color: '#4f46e5',
                                    },
                                }}
                            />
                            Profile
                        </Box>
                    </th>
                    <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8fafc', 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                    }}>Description</th>
                    <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8fafc', 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                    }}>Modules</th>
                    <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'left', 
                        backgroundColor: '#f8fafc', 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem'
                    }}>Status</th>
                    <th style={{ 
                        padding: '16px 20px', 
                        textAlign: 'center', 
                        backgroundColor: '#f8fafc', 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontSize: '0.875rem',
                        width: '140px'
                    }}>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredProfiles.map((profile) => (
                    <tr 
                        key={profile.id}
                        onClick={(e) => handleProfileClick(profile, e)}
                        style={{ 
                            cursor: 'pointer',
                            backgroundColor: selectedProfiles.includes(profile.id) ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
                            transition: 'all 0.2s ease'
                        }}
                        className="profile-row"
                    >
                        <td style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            fontSize: '0.875rem',
                            color: '#334155'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Checkbox
                                    checked={selectedProfiles.includes(profile.id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (selectedProfiles.includes(profile.id)) {
                                            setSelectedProfiles(prev => prev.filter(id => id !== profile.id));
                                        } else {
                                            setSelectedProfiles(prev => [...prev, profile.id]);
                                        }
                                    }}
                                    size="small"
                                    sx={{
                                        color: '#94a3b8',
                                        '&.Mui-checked': {
                                            color: '#4f46e5',
                                        },
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Avatar
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: getAvatarColor(profile.id),
                                        fontSize: '1rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {getInitials(profile.name)}
                                </Avatar>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#1e293b' }}>
                                    {profile.name}
                                </Typography>
                            </Box>
                        </td>
                        <td style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            fontSize: '0.875rem',
                            color: '#64748b'
                        }}>
                            <Typography 
                                variant="body2" 
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    maxWidth: '250px'
                                }}
                            >
                                {profile.description || 'No description'}
                            </Typography>
                        </td>
                        <td style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            fontSize: '0.875rem'
                        }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {profile.modules?.slice(0, 2).map(moduleId => {
                                    const module = modules.find(m => m.id === moduleId);
                                    return module ? (
                                        <Chip
                                            key={module.id}
                                            label={module.title}
                                            size="small"
                                            sx={{ 
                                                bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                color: '#4f46e5',
                                                fontWeight: 500,
                                                borderRadius: '6px',
                                                height: '24px',
                                                fontSize: '0.75rem'
                                            }}
                                        />
                                    ) : null;
                                })}
                                {profile.modules?.length > 2 && (
                                    <Chip
                                        label={`+${profile.modules.length - 2}`}
                                        size="small"
                                        sx={{ 
                                            bgcolor: 'rgba(148, 163, 184, 0.1)',
                                            color: '#64748b',
                                            fontWeight: 500,
                                            borderRadius: '6px',
                                            height: '24px',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                )}
                                {(!profile.modules || profile.modules.length === 0) && (
                                    <Typography variant="body2" color="text.secondary">
                                        No modules
                                    </Typography>
                                )}
                            </Box>
                        </td>
                        <td style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            fontSize: '0.875rem'
                        }}>
                            <StatusBadge status={profile.status} />
                        </td>
                        <td style={{ 
                            padding: '16px 20px', 
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            textAlign: 'center'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Tooltip title={t('profiles.viewDetails')}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProfileClick(profile, e);
                                        }}
                                        sx={{ 
                                            color: '#4f46e5',
                                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                            width: '32px',
                                            height: '32px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                                                transform: 'scale(1.05)'
                                            }
                                        }}
                                    >
                                        <InfoIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('profiles.edit')}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(profile.id);
                                        }}
                                        sx={{ 
                                            color: '#3b82f6',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            width: '32px',
                                            height: '32px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                                transform: 'scale(1.05)'
                                            }
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('profiles.delete')}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(profile.id);
                                        }}
                                        sx={{ 
                                            color: '#ef4444',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            width: '32px',
                                            height: '32px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                transform: 'scale(1.05)'
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Box>
)} 