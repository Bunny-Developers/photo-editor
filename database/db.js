const fs = require('fs').promises;
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'database', 'db.json');
        this.imagesPath = path.join(__dirname, 'uploads');
        this.initialize();
    }

    async initialize() {
        try {
            // Create database directory if it doesn't exist
            const dbDir = path.dirname(this.dbPath);
            await fs.mkdir(dbDir, { recursive: true });

            // Create uploads directory if it doesn't exist
            await fs.mkdir(this.imagesPath, { recursive: true });

            // Initialize database file if it doesn't exist
            try {
                await fs.access(this.dbPath);
            } catch {
                const initialData = {
                    images: [],
                    subscriptions: [],
                    users: [],
                    searches: [],
                    stats: {
                        totalImages: 0,
                        totalSubscriptions: 0,
                        totalSearches: 0,
                        lastBackup: null
                    }
                };
                await fs.writeFile(this.dbPath, JSON.stringify(initialData, null, 2));
                console.log('Database initialized successfully');
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    // Read the entire database
    async read() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading database:', error);
            throw new Error('Failed to read database');
        }
    }

    // Write to the database
    async write(data) {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing to database:', error);
            throw new Error('Failed to write to database');
        }
    }

    // Image Methods
    async addImage(imageData) {
        try {
            const db = await this.read();
            
            const newImage = {
                id: this.generateId(),
                ...imageData,
                uploadDate: new Date().toISOString(),
                edits: [],
                metadata: {
                    downloads: 0,
                    views: 0,
                    lastAccessed: new Date().toISOString()
                }
            };

            db.images.push(newImage);
            db.stats.totalImages = db.images.length;
            
            await this.write(db);
            
            // Log the action
            await this.logActivity('image_uploaded', { imageId: newImage.id });
            
            return newImage;
        } catch (error) {
            console.error('Error adding image:', error);
            throw error;
        }
    }

    async getImages(filter = {}) {
        try {
            const db = await this.read();
            let images = [...db.images];

            // Apply filters
            if (filter.userId) {
                images = images.filter(img => img.userId === filter.userId);
            }

            if (filter.fromDate) {
                images = images.filter(img => new Date(img.uploadDate) >= new Date(filter.fromDate));
            }

            if (filter.toDate) {
                images = images.filter(img => new Date(img.uploadDate) <= new Date(filter.toDate));
            }

            if (filter.tags && filter.tags.length > 0) {
                images = images.filter(img => 
                    img.tags && filter.tags.some(tag => img.tags.includes(tag))
                );
            }

            // Sort by date (newest first)
            images.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

            return images;
        } catch (error) {
            console.error('Error getting images:', error);
            throw error;
        }
    }

    async getImageById(id) {
        try {
            const db = await this.read();
            const image = db.images.find(img => img.id === id);
            
            if (image) {
                // Update view count
                image.metadata.views += 1;
                image.metadata.lastAccessed = new Date().toISOString();
                await this.write(db);
            }
            
            return image;
        } catch (error) {
            console.error('Error getting image by ID:', error);
            throw error;
        }
    }

    async updateImage(id, updates) {
        try {
            const db = await this.read();
            const index = db.images.findIndex(img => img.id === id);
            
            if (index === -1) {
                throw new Error('Image not found');
            }

            db.images[index] = {
                ...db.images[index],
                ...updates,
                lastModified: new Date().toISOString()
            };

            await this.write(db);
            
            // Log the action
            await this.logActivity('image_updated', { imageId: id });
            
            return db.images[index];
        } catch (error) {
            console.error('Error updating image:', error);
            throw error;
        }
    }

    async deleteImage(id) {
        try {
            const db = await this.read();
            const initialLength = db.images.length;
            
            db.images = db.images.filter(img => img.id !== id);
            
            if (db.images.length === initialLength) {
                throw new Error('Image not found');
            }

            db.stats.totalImages = db.images.length;
            
            await this.write(db);
            
            // Log the action
            await this.logActivity('image_deleted', { imageId: id });
            
            return { success: true, message: 'Image deleted successfully' };
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    async addImageEdit(imageId, editData) {
        try {
            const db = await this.read();
            const image = db.images.find(img => img.id === imageId);
            
            if (!image) {
                throw new Error('Image not found');
            }

            const edit = {
                id: this.generateId(),
                ...editData,
                createdAt: new Date().toISOString()
            };

            if (!image.edits) {
                image.edits = [];
            }

            image.edits.push(edit);
            image.lastModified = new Date().toISOString();

            await this.write(db);
            
            return edit;
        } catch (error) {
            console.error('Error adding image edit:', error);
            throw error;
        }
    }

    async incrementImageDownloads(imageId) {
        try {
            const db = await this.read();
            const image = db.images.find(img => img.id === imageId);
            
            if (image) {
                image.metadata.downloads += 1;
                await this.write(db);
            }
            
            return true;
        } catch (error) {
            console.error('Error incrementing downloads:', error);
            throw error;
        }
    }

    // Subscription Methods
    async addSubscription(subscriptionData) {
        try {
            const db = await this.read();
            
            // Check if already exists
            const existing = db.subscriptions.find(
                sub => sub.email === subscriptionData.email && sub.active === true
            );

            if (existing) {
                throw new Error('Email already subscribed');
            }

            const newSubscription = {
                id: this.generateId(),
                ...subscriptionData,
                subscribedAt: new Date().toISOString(),
                active: true,
                metadata: {
                    unsubscribeCount: 0,
                    lastEmailSent: null
                }
            };

            db.subscriptions.push(newSubscription);
            db.stats.totalSubscriptions = db.subscriptions.filter(s => s.active).length;
            
            await this.write(db);
            
            // Log the action
            await this.logActivity('subscription_added', { email: subscriptionData.email });
            
            return newSubscription;
        } catch (error) {
            console.error('Error adding subscription:', error);
            throw error;
        }
    }

    async getSubscriptions(activeOnly = true) {
        try {
            const db = await this.read();
            let subscriptions = [...db.subscriptions];
            
            if (activeOnly) {
                subscriptions = subscriptions.filter(sub => sub.active === true);
            }
            
            return subscriptions;
        } catch (error) {
            console.error('Error getting subscriptions:', error);
            throw error;
        }
    }

    async unsubscribe(email) {
        try {
            const db = await this.read();
            let found = false;

            db.subscriptions = db.subscriptions.map(sub => {
                if (sub.email === email && sub.active) {
                    found = true;
                    return {
                        ...sub,
                        active: false,
                        unsubscribedAt: new Date().toISOString(),
                        metadata: {
                            ...sub.metadata,
                            unsubscribeCount: (sub.metadata?.unsubscribeCount || 0) + 1
                        }
                    };
                }
                return sub;
            });

            if (!found) {
                throw new Error('Active subscription not found');
            }

            db.stats.totalSubscriptions = db.subscriptions.filter(s => s.active).length;
            
            await this.write(db);
            
            // Log the action
            await this.logActivity('subscription_removed', { email });
            
            return { success: true, message: 'Unsubscribed successfully' };
        } catch (error) {
            console.error('Error unsubscribing:', error);
            throw error;
        }
    }

    async checkSubscription(email) {
        try {
            const db = await this.read();
            const subscription = db.subscriptions.find(
                sub => sub.email === email && sub.active === true
            );
            return subscription || null;
        } catch (error) {
            console.error('Error checking subscription:', error);
            throw error;
        }
    }

    async updateSubscriptionLastEmail(email) {
        try {
            const db = await this.read();
            const subscription = db.subscriptions.find(sub => sub.email === email);
            
            if (subscription) {
                subscription.metadata.lastEmailSent = new Date().toISOString();
                await this.write(db);
            }
            
            return true;
        } catch (error) {
            console.error('Error updating subscription last email:', error);
            throw error;
        }
    }

    // Search History Methods
    async addSearch(searchData) {
        try {
            const db = await this.read();
            
            const search = {
                id: this.generateId(),
                ...searchData,
                timestamp: new Date().toISOString()
            };

            if (!db.searches) {
                db.searches = [];
            }

            db.searches.push(search);
            db.stats.totalSearches = db.searches.length;
            
            // Keep only last 100 searches to prevent database bloat
            if (db.searches.length > 100) {
                db.searches = db.searches.slice(-100);
            }
            
            await this.write(db);
            
            return search;
        } catch (error) {
            console.error('Error adding search:', error);
            throw error;
        }
    }

    async getSearchHistory(limit = 50) {
        try {
            const db = await this.read();
            const searches = db.searches || [];
            
            return searches
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting search history:', error);
            throw error;
        }
    }

    // User Methods (if you implement user accounts)
    async addUser(userData) {
        try {
            const db = await this.read();
            
            const newUser = {
                id: this.generateId(),
                ...userData,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                preferences: {},
                stats: {
                    totalUploads: 0,
                    totalEdits: 0,
                    totalSearches: 0
                }
            };

            db.users.push(newUser);
            
            await this.write(db);
            
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    }

    async getUserById(id) {
        try {
            const db = await this.read();
            return db.users.find(user => user.id === id) || null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    // Statistics Methods
    async getStats() {
        try {
            const db = await this.read();
            
            // Calculate additional stats
            const activeSubscriptions = db.subscriptions.filter(s => s.active).length;
            const totalEdits = db.images.reduce((acc, img) => acc + (img.edits?.length || 0), 0);
            const totalDownloads = db.images.reduce((acc, img) => acc + (img.metadata?.downloads || 0), 0);
            
            return {
                ...db.stats,
                activeSubscriptions,
                totalEdits,
                totalDownloads,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }

    // Activity Logging
    async logActivity(action, details = {}) {
        try {
            const db = await this.read();
            
            if (!db.activityLog) {
                db.activityLog = [];
            }

            const activity = {
                id: this.generateId(),
                action,
                details,
                timestamp: new Date().toISOString()
            };

            db.activityLog.push(activity);
            
            // Keep only last 1000 activities
            if (db.activityLog.length > 1000) {
                db.activityLog = db.activityLog.slice(-1000);
            }
            
            await this.write(db);
            
            return activity;
        } catch (error) {
            console.error('Error logging activity:', error);
            // Don't throw - logging should not break main functionality
        }
    }

    async getActivityLog(limit = 100) {
        try {
            const db = await this.read();
            const logs = db.activityLog || [];
            
            return logs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting activity log:', error);
            throw error;
        }
    }

    // Backup and Maintenance
    async createBackup() {
        try {
            const db = await this.read();
            
            const backup = {
                timestamp: new Date().toISOString(),
                data: db,
                version: '1.0.0'
            };

            const backupPath = path.join(__dirname, 'database', `backup-${Date.now()}.json`);
            await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
            
            // Update last backup time
            db.stats.lastBackup = new Date().toISOString();
            await this.write(db);
            
            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async cleanupOldFiles(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            const db = await this.read();
            
            // This is where you would implement cleanup logic
            // For example, removing old temporary files
            
            await this.logActivity('cleanup_performed', { daysOld });
            
            return { success: true, message: `Cleaned up files older than ${daysOld} days` };
        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    async searchImages(query) {
        try {
            const db = await this.read();
            const lowerQuery = query.toLowerCase();
            
            return db.images.filter(img => 
                img.originalName?.toLowerCase().includes(lowerQuery) ||
                img.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        } catch (error) {
            console.error('Error searching images:', error);
            throw error;
        }
    }

    async addTagsToImage(imageId, tags) {
        try {
            const db = await this.read();
            const image = db.images.find(img => img.id === imageId);
            
            if (!image) {
                throw new Error('Image not found');
            }

            if (!image.tags) {
                image.tags = [];
            }

            // Add new tags, avoiding duplicates
            const newTags = tags.filter(tag => !image.tags.includes(tag));
            image.tags = [...image.tags, ...newTags];
            
            await this.write(db);
            
            return image.tags;
        } catch (error) {
            console.error('Error adding tags:', error);
            throw error;
        }
    }
}

// Create and export a singleton instance
const db = new Database();

module.exports = db;